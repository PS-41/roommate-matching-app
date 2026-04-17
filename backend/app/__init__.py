from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable Cross-Origin Resource Sharing (Allows React to communicate with Flask)
    CORS(app)

    # A simple health-check route to test our setup
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "success",
            "message": "Roommate Matching API is running properly!",
            "environment": app.config['FLASK_ENV']
        }), 200

    return app