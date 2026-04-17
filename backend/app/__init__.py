import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config
from .extensions import db, migrate

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    CORS(app)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Initialize JWT Manager
    jwt = JWTManager(app)
    
    # Import models so Flask-Migrate can register them
    from . import models

    # Import and register the authentication blueprint
    from .auth import auth_bp
    app.register_blueprint(auth_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "success",
            "message": "Roommate Matching API is running properly!",
            "environment": app.config['FLASK_ENV']
        }), 200

    return app
