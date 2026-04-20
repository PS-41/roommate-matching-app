from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    first_name = db.Column(db.String(64), nullable=True)
    last_name = db.Column(db.String(64), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(32), nullable=True)
    occupation = db.Column(db.String(64), nullable=True)

    about_me = db.Column(db.Text, nullable=True)
    profile_photo_path = db.Column(db.String(256), nullable=True)

    target_country = db.Column(db.String(2), nullable=True)
    zip_code = db.Column(db.String(20), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    preference = db.relationship(
        'Preference',
        backref='user',
        uselist=False,
        cascade='all, delete-orphan'
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Preference(db.Model):
    __tablename__ = 'preferences'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)

    search_radius_miles = db.Column(db.Integer, default=10)
    preferred_gender = db.Column(db.String(32), default='Any')
    preferred_age_min = db.Column(db.Integer, nullable=True)
    preferred_age_max = db.Column(db.Integer, nullable=True)

    my_cleanliness = db.Column(db.Integer, nullable=True)
    pref_cleanliness = db.Column(db.Integer, nullable=True)
    cleanliness_is_strict = db.Column(db.Boolean, default=False)
    cleanliness_do_not_care = db.Column(db.Boolean, default=False)

    my_sleep_schedule = db.Column(db.Integer, nullable=True)
    pref_sleep_schedule = db.Column(db.Integer, nullable=True)
    sleep_schedule_is_strict = db.Column(db.Boolean, default=False)
    sleep_schedule_do_not_care = db.Column(db.Boolean, default=False)

    my_noise_tolerance = db.Column(db.Integer, nullable=True)
    pref_noise_tolerance = db.Column(db.Integer, nullable=True)
    noise_tolerance_is_strict = db.Column(db.Boolean, default=False)
    noise_tolerance_do_not_care = db.Column(db.Boolean, default=False)

    my_guests_frequency = db.Column(db.Integer, nullable=True)
    pref_guests_frequency = db.Column(db.Integer, nullable=True)
    guests_frequency_is_strict = db.Column(db.Boolean, default=False)
    guests_frequency_do_not_care = db.Column(db.Boolean, default=False)

    my_smoking = db.Column(db.Integer, nullable=True)
    pref_smoking = db.Column(db.Integer, nullable=True)
    smoking_is_strict = db.Column(db.Boolean, default=False)
    smoking_do_not_care = db.Column(db.Boolean, default=False)

    my_drinking = db.Column(db.Integer, nullable=True)
    pref_drinking = db.Column(db.Integer, nullable=True)
    drinking_is_strict = db.Column(db.Boolean, default=False)
    drinking_do_not_care = db.Column(db.Boolean, default=False)

    budget_min = db.Column(db.Integer, nullable=True)
    budget_max = db.Column(db.Integer, nullable=True)
    budget_is_strict = db.Column(db.Boolean, default=False)

    has_pets = db.Column(db.Boolean, nullable=True)
    pref_no_pets = db.Column(db.Boolean, nullable=True)
    pets_is_strict = db.Column(db.Boolean, default=False)


class Match(db.Model):
    __tablename__ = 'matches'

    id = db.Column(db.Integer, primary_key=True)
    user_a_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_b_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    compatibility_score = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class ConnectionRequest(db.Model):
    __tablename__ = 'connection_requests'

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='Pending')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_read = db.Column(db.Boolean, default=False)