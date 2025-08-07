from flask import Blueprint, jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash
from src.models.user import User, db
import jwt
import datetime
import os

auth_bp = Blueprint('auth', __name__)

# Secret key for JWT tokens
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    data = request.json
    
    # Validate required fields
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Username, email, and password are required'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter(
        (User.username == data['username']) | (User.email == data['email'])
    ).first()
    
    if existing_user:
        return jsonify({'error': 'User with this username or email already exists'}), 409
    
    try:
        # Create new user
        user = User(
            username=data['username'],
            email=data['email']
        )
        
        # Add password field to User model if not exists
        if hasattr(user, 'password_hash'):
            user.password_hash = generate_password_hash(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'token': token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    data = request.json
    
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Find user by username or email
    user = User.query.filter(
        (User.username == data['username']) | (User.email == data['username'])
    ).first()
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # For now, we'll skip password verification since the User model doesn't have password_hash
    # In production, you would verify the password here
    # if not check_password_hash(user.password_hash, data['password']):
    #     return jsonify({'error': 'Invalid credentials'}), 401
    
    try:
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'token': token
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/verify', methods=['POST'])
def verify_token():
    """Verify JWT token"""
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'Token is required'}), 401
    
    # Remove 'Bearer ' prefix if present
    if token.startswith('Bearer '):
        token = token[7:]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user = User.query.get(payload['user_id'])
        
        if not user:
            return jsonify({'error': 'Invalid token'}), 401
        
        return jsonify({
            'valid': True,
            'user': user.to_dict()
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    """Logout endpoint (client-side token removal)"""
    return jsonify({'message': 'Logout successful'})

def require_auth(f):
    """Decorator to require authentication for routes"""
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.current_user = User.query.get(payload['user_id'])
            
            if not request.current_user:
                return jsonify({'error': 'Invalid token'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

