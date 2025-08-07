from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class AISession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=True)
    session_type = db.Column(db.String(50), nullable=False)  # 'code_generation', 'refactoring', 'debugging', etc.
    prompt = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text)
    model_used = db.Column(db.String(100))
    tokens_used = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'failed'
    
    # Relationships
    user = db.relationship('User', backref=db.backref('ai_sessions', lazy=True))
    
    def __repr__(self):
        return f'<AISession {self.id} - {self.session_type}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'session_type': self.session_type,
            'prompt': self.prompt,
            'response': self.response,
            'model_used': self.model_used,
            'tokens_used': self.tokens_used,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'status': self.status
        }

class CodeAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    file_id = db.Column(db.Integer, db.ForeignKey('code_file.id'), nullable=True)
    analysis_type = db.Column(db.String(50), nullable=False)  # 'syntax', 'semantic', 'dependency', etc.
    results = db.Column(db.Text)  # JSON string containing analysis results
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    project = db.relationship('Project', backref=db.backref('analyses', lazy=True))
    
    def __repr__(self):
        return f'<CodeAnalysis {self.id} - {self.analysis_type}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'file_id': self.file_id,
            'analysis_type': self.analysis_type,
            'results': self.results,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

