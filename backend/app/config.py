import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'fallback-secret-key'
    FLASK_ENV = os.environ.get('FLASK_ENV') or 'development'
    PORT = int(os.environ.get('PORT', 5000))
    # We will add database URIs and other configs here later