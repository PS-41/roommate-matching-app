import os
from dotenv import load_dotenv

# Base directory of the project
basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'fallback-secret-key'
    FLASK_ENV = os.environ.get('FLASK_ENV') or 'development'
    PORT = int(os.environ.get('PORT', 5000))
    
    # Database Configuration (Defaults to local SQLite file named app.db)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload folder configuration
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024 # 5MB max upload size

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'fallback-jwt-secret'