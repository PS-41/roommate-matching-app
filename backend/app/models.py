from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    
    # Core Identity
    first_name = db.Column(db.String(64), nullable=True)
    last_name = db.Column(db.String(64), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(32), nullable=True)
    occupation = db.Column(db.String(64), nullable=True) # Undergrad, Grad, Professional
    
    # Profile Elements
    about_me = db.Column(db.Text, nullable=True)
    profile_photo_path = db.Column(db.String(256), nullable=True)
    
    # Location (Populated via pgeocode)
    target_country = db.Column(db.String(2), nullable=True) # e.g., 'us', 'ca'
    zip_code = db.Column(db.String(20), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship to preferences
    preference = db.relationship('Preference', backref='user', uselist=False, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Preference(db.Model):
    __tablename__ = 'preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Base Filters
    search_radius_miles = db.Column(db.Integer, default=10)
    preferred_gender = db.Column(db.String(32), default='Any')
    preferred_age_min = db.Column(db.Integer, nullable=True)
    preferred_age_max = db.Column(db.Integer, nullable=True)
    
    # The "Dual-Trait" System (1-5 Scale)
    my_cleanliness = db.Column(db.Integer, nullable=True)
    pref_cleanliness = db.Column(db.Integer, nullable=True)
    cleanliness_is_strict = db.Column(db.Boolean, default=False)
    
    my_sleep_schedule = db.Column(db.Integer, nullable=True)
    pref_sleep_schedule = db.Column(db.Integer, nullable=True)
    sleep_is_strict = db.Column(db.Boolean, default=False)
    
    my_noise_tolerance = db.Column(db.Integer, nullable=True)
    pref_noise_tolerance = db.Column(db.Integer, nullable=True)
    noise_is_strict = db.Column(db.Boolean, default=False)
    
    my_guests_frequency = db.Column(db.Integer, nullable=True)
    pref_guests_frequency = db.Column(db.Integer, nullable=True)
    guests_is_strict = db.Column(db.Boolean, default=False)
    
    # Boolean Habits
    is_smoker = db.Column(db.Boolean, nullable=True)
    pref_smoker = db.Column(db.Boolean, nullable=True) # e.g., True if they want a smoker, False if they don't
    smoker_is_strict = db.Column(db.Boolean, default=False)
    
    has_pets = db.Column(db.Boolean, nullable=True)
    pref_pets = db.Column(db.Boolean, nullable=True)
    pets_is_strict = db.Column(db.Boolean, default=False)

class Match(db.Model):
    __tablename__ = 'matches'
    
    id = db.Column(db.Integer, primary_key=True)
    user_a_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_b_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    compatibility_score = db.Column(db.Float, nullable=False) # Normalized 0-100
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class ConnectionRequest(db.Model):
    __tablename__ = 'connection_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='Pending') # Pending, Accepted, Declined
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_read = db.Column(db.Boolean, default=False)