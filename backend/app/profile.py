from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pgeocode
from .models import User, Preference
from .extensions import db

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')

@profile_bp.route('/update', methods=['POST'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()

    # 1. Update Core User Data
    user.first_name = data.get('first_name')
    user.last_name = data.get('last_name')
    user.age = data.get('age')
    user.gender = data.get('gender')
    user.occupation = data.get('occupation')
    user.about_me = data.get('about_me')
    
    # 2. Process Location with pgeocode
    target_country = data.get('target_country', 'us').lower()
    zip_code = data.get('zip_code')
    
    if target_country and zip_code:
        try:
            nomi = pgeocode.Nominatim(target_country)
            location_data = nomi.query_postal_code(zip_code)
            
            # Check if pgeocode actually found the location (it returns NaN for invalid zips)
            import math
            if isinstance(location_data.latitude, float) and not math.isnan(location_data.latitude):
                user.target_country = target_country
                user.zip_code = zip_code
                user.latitude = location_data.latitude
                user.longitude = location_data.longitude
            else:
                return jsonify({"error": "Invalid ZIP code or country combination"}), 400
        except Exception as e:
            return jsonify({"error": f"Location processing failed: {str(e)}"}), 500

    # 3. Handle Preferences
    # Check if preference already exists, if not, create one
    pref = Preference.query.filter_by(user_id=user.id).first()
    if not pref:
        pref = Preference(user_id=user.id)
        db.session.add(pref)

    # Base Filters
    pref.search_radius_miles = data.get('search_radius_miles', 10)
    pref.preferred_gender = data.get('preferred_gender', 'Any')
    pref.preferred_age_min = data.get('preferred_age_min')
    pref.preferred_age_max = data.get('preferred_age_max')

    # Dual-Trait System (Cleanliness)
    pref.my_cleanliness = data.get('my_cleanliness')
    pref.pref_cleanliness = data.get('pref_cleanliness')
    pref.cleanliness_is_strict = data.get('cleanliness_is_strict', False)

    # Dual-Trait System (Sleep)
    pref.my_sleep_schedule = data.get('my_sleep_schedule')
    pref.pref_sleep_schedule = data.get('pref_sleep_schedule')
    pref.sleep_is_strict = data.get('sleep_is_strict', False)

    # Dual-Trait System (Noise)
    pref.my_noise_tolerance = data.get('my_noise_tolerance')
    pref.pref_noise_tolerance = data.get('pref_noise_tolerance')
    pref.noise_is_strict = data.get('noise_is_strict', False)

    # Dual-Trait System (Guests)
    pref.my_guests_frequency = data.get('my_guests_frequency')
    pref.pref_guests_frequency = data.get('pref_guests_frequency')
    pref.guests_is_strict = data.get('guests_is_strict', False)

    # Habits
    pref.is_smoker = data.get('is_smoker')
    pref.pref_smoker = data.get('pref_smoker')
    pref.smoker_is_strict = data.get('smoker_is_strict', False)
    
    pref.has_pets = data.get('has_pets')
    pref.pref_pets = data.get('pref_pets')
    pref.pets_is_strict = data.get('pets_is_strict', False)

    # Commit everything to the database
    db.session.commit()

    return jsonify({"message": "Profile updated successfully"}), 200

@profile_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    pref = Preference.query.filter_by(user_id=user.id).first()

    # We return the data matching exactly what the React form expects
    profile_data = {
        "first_name": user.first_name or '',
        "last_name": user.last_name or '',
        "age": user.age or '',
        "gender": user.gender or 'Any',
        "occupation": user.occupation or 'Undergrad',
        "about_me": user.about_me or '',
        "target_country": user.target_country or 'us',
        "zip_code": user.zip_code or '',
        
        # Preferences (fallback to defaults if they haven't set them yet)
        "search_radius_miles": pref.search_radius_miles if pref else 10,
        "my_cleanliness": pref.my_cleanliness if pref else 3,
        "pref_cleanliness": pref.pref_cleanliness if pref else 3,
        "cleanliness_is_strict": pref.cleanliness_is_strict if pref else False,
        
        "my_sleep_schedule": pref.my_sleep_schedule if pref else 3,
        "pref_sleep_schedule": pref.pref_sleep_schedule if pref else 3,
        "sleep_is_strict": pref.sleep_is_strict if pref else False,
        
        "my_noise_tolerance": pref.my_noise_tolerance if pref else 3,
        "pref_noise_tolerance": pref.pref_noise_tolerance if pref else 3,
        "noise_is_strict": pref.noise_is_strict if pref else False,
        
        "my_guests_frequency": pref.my_guests_frequency if pref else 3,
        "pref_guests_frequency": pref.pref_guests_frequency if pref else 3,
        "guests_is_strict": pref.guests_is_strict if pref else False,
        
        "is_smoker": pref.is_smoker if pref is not None and pref.is_smoker is not None else False,
        "pref_smoker": pref.pref_smoker if pref is not None and pref.pref_smoker is not None else False,
        "smoker_is_strict": pref.smoker_is_strict if pref else False,
        
        "has_pets": pref.has_pets if pref is not None and pref.has_pets is not None else False,
        "pref_pets": pref.pref_pets if pref is not None and pref.pref_pets is not None else False,
        "pets_is_strict": pref.pets_is_strict if pref else False,
    }

    return jsonify(profile_data), 200