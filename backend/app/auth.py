from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .models import User
from .extensions import db

# Create a Blueprint named 'auth' with a URL prefix
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409

    # Create new user
    new_user = User(username=username)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User created successfully", 
        "user": {"id": new_user.id, "username": new_user.username}
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    # Verify user exists and password matches
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    # Create the JWT token, using the user ID as the identity
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id, 
            "username": user.username,
            "has_location_set": bool(user.target_country and user.zip_code)
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    # This route requires a valid JWT token in the Authorization header
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "has_location_set": bool(user.target_country and user.zip_code)
    }), 200