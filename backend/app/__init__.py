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

    db.init_app(app)
    migrate.init_app(app, db)

    jwt = JWTManager(app)

    from . import models

    from .auth import auth_bp
    app.register_blueprint(auth_bp)

    from .profile import profile_bp
    app.register_blueprint(profile_bp)

    from .compatibility import compatibility_bp
    app.register_blueprint(compatibility_bp)

    from .messages import messages_bp
    app.register_blueprint(messages_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "success",
            "message": "Roommate Matching API is running properly!",
            "environment": app.config['FLASK_ENV']
        }), 200

    return app