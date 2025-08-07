from flask import Blueprint, jsonify, request
from src.models.ai_session import AISession, CodeAnalysis, db
from src.models.project import Project, CodeFile
import openai
import json
import os

ai_bp = Blueprint('ai', __name__)

# Initialize OpenAI client
openai.api_key = os.getenv('OPENAI_API_KEY')
openai.api_base = os.getenv('OPENAI_API_BASE', 'https://api.openai.com/v1')

@ai_bp.route('/ai/chat', methods=['POST'])
def ai_chat():
    """General AI chat endpoint for code assistance"""
    data = request.json
    user_id = data.get('user_id')
    project_id = data.get('project_id')
    prompt = data.get('prompt')
    session_type = data.get('session_type', 'general')
    model = data.get('model', 'gpt-3.5-turbo')
    
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400
    
    # Create AI session record
    ai_session = AISession(
        user_id=user_id,
        project_id=project_id,
        session_type=session_type,
        prompt=prompt,
        model_used=model,
        status='pending'
    )
    db.session.add(ai_session)
    db.session.commit()
    
    try:
        # Get project context if project_id is provided
        context = ""
        if project_id:
            project = Project.query.get(project_id)
            if project:
                context = f"Project: {project.name} ({project.language})\n"
                context += f"Description: {project.description}\n\n"
                
                # Get recent files for context
                recent_files = CodeFile.query.filter_by(project_id=project_id).limit(5).all()
                for file in recent_files:
                    context += f"File: {file.file_path}\n"
                    context += f"```{file.language}\n{file.content[:500]}...\n```\n\n"
        
        # Prepare messages for OpenAI
        messages = [
            {
                "role": "system",
                "content": f"You are an AI coding assistant similar to Brokk.ai. You help developers with code generation, refactoring, debugging, and understanding large codebases. {context}"
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model=model,
            messages=messages,
            max_tokens=2000,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        
        # Update AI session with response
        ai_session.response = ai_response
        ai_session.tokens_used = tokens_used
        ai_session.status = 'completed'
        db.session.commit()
        
        return jsonify({
            'session_id': ai_session.id,
            'response': ai_response,
            'tokens_used': tokens_used,
            'status': 'completed'
        })
        
    except Exception as e:
        ai_session.status = 'failed'
        ai_session.response = str(e)
        db.session.commit()
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/ai/code-generation', methods=['POST'])
def generate_code():
    """Specific endpoint for code generation"""
    data = request.json
    user_id = data.get('user_id')
    project_id = data.get('project_id')
    description = data.get('description')
    language = data.get('language', 'javascript')
    context_files = data.get('context_files', [])
    
    if not description:
        return jsonify({'error': 'Description is required'}), 400
    
    # Build context from provided files
    context = f"Generate {language} code based on the following description:\n{description}\n\n"
    
    if context_files:
        context += "Context files:\n"
        for file_id in context_files:
            file = CodeFile.query.get(file_id)
            if file:
                context += f"File: {file.file_path}\n```{file.language}\n{file.content}\n```\n\n"
    
    # Create AI session
    ai_session = AISession(
        user_id=user_id,
        project_id=project_id,
        session_type='code_generation',
        prompt=context,
        model_used='gpt-3.5-turbo',
        status='pending'
    )
    db.session.add(ai_session)
    db.session.commit()
    
    try:
        messages = [
            {
                "role": "system",
                "content": f"You are a code generation assistant. Generate clean, well-documented {language} code based on user requirements. Only return the code without explanations unless specifically asked."
            },
            {
                "role": "user",
                "content": context
            }
        ]
        
        response = openai.ChatCompletion.create(
            model='gpt-3.5-turbo',
            messages=messages,
            max_tokens=2000,
            temperature=0.3
        )
        
        generated_code = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        
        ai_session.response = generated_code
        ai_session.tokens_used = tokens_used
        ai_session.status = 'completed'
        db.session.commit()
        
        return jsonify({
            'session_id': ai_session.id,
            'generated_code': generated_code,
            'tokens_used': tokens_used,
            'status': 'completed'
        })
        
    except Exception as e:
        ai_session.status = 'failed'
        ai_session.response = str(e)
        db.session.commit()
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/ai/code-analysis', methods=['POST'])
def analyze_code():
    """Analyze code for issues, suggestions, etc."""
    data = request.json
    project_id = data.get('project_id')
    file_id = data.get('file_id')
    analysis_type = data.get('analysis_type', 'general')
    
    if not file_id:
        return jsonify({'error': 'File ID is required'}), 400
    
    file = CodeFile.query.get_or_404(file_id)
    
    try:
        # Prepare analysis prompt
        prompt = f"Analyze the following {file.language} code for {analysis_type} issues:\n\n```{file.language}\n{file.content}\n```\n\nProvide suggestions for improvement."
        
        messages = [
            {
                "role": "system",
                "content": "You are a code analysis assistant. Analyze code for bugs, performance issues, best practices, and provide constructive feedback."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        response = openai.ChatCompletion.create(
            model='gpt-3.5-turbo',
            messages=messages,
            max_tokens=1500,
            temperature=0.3
        )
        
        analysis_result = response.choices[0].message.content
        
        # Save analysis result
        analysis = CodeAnalysis(
            project_id=project_id,
            file_id=file_id,
            analysis_type=analysis_type,
            results=analysis_result
        )
        db.session.add(analysis)
        db.session.commit()
        
        return jsonify({
            'analysis_id': analysis.id,
            'analysis': analysis_result,
            'file_path': file.file_path
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/ai/sessions', methods=['GET'])
def get_ai_sessions():
    """Get AI session history for a user"""
    user_id = request.args.get('user_id')
    project_id = request.args.get('project_id')
    
    query = AISession.query
    if user_id:
        query = query.filter_by(user_id=user_id)
    if project_id:
        query = query.filter_by(project_id=project_id)
    
    sessions = query.order_by(AISession.created_at.desc()).limit(50).all()
    return jsonify([session.to_dict() for session in sessions])

@ai_bp.route('/ai/sessions/<int:session_id>', methods=['GET'])
def get_ai_session(session_id):
    """Get specific AI session details"""
    session = AISession.query.get_or_404(session_id)
    return jsonify(session.to_dict())

