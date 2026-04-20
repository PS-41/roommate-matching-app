from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import math
import pgeocode
from .models import User, Preference
from .extensions import db

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')


def to_int(val):
    try:
        if val == '' or val is None:
            return None
        return int(val)
    except (TypeError, ValueError):
        return None


def to_bool(val, default=False):
    if isinstance(val, bool):
        return val
    if val in ['true', 'True', '1', 1]:
        return True
    if val in ['false', 'False', '0', 0]:
        return False
    return default


def to_str(val):
    if val is None:
        return None
    if isinstance(val, str):
        cleaned = val.strip()
        return cleaned if cleaned != '' else None
    return str(val)


@profile_bp.route('/update', methods=['POST'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}

    user.first_name = to_str(data.get('first_name'))
    user.last_name = to_str(data.get('last_name'))
    user.age = to_int(data.get('age'))
    user.gender = to_str(data.get('gender'))
    user.occupation = to_str(data.get('occupation'))
    user.about_me = to_str(data.get('about_me'))

    target_country = (data.get('target_country') or '').strip().lower()
    zip_code = (data.get('zip_code') or '').strip()

    if target_country and zip_code:
        try:
            nomi = pgeocode.Nominatim(target_country)
            location_data = nomi.query_postal_code(zip_code)

            if (
                location_data is not None
                and isinstance(location_data.latitude, float)
                and not math.isnan(location_data.latitude)
                and isinstance(location_data.longitude, float)
                and not math.isnan(location_data.longitude)
            ):
                user.target_country = target_country
                user.zip_code = zip_code
                user.latitude = location_data.latitude
                user.longitude = location_data.longitude
            else:
                return jsonify({"error": "Invalid ZIP/postal code or country combination"}), 400
        except Exception as e:
            return jsonify({"error": f"Location processing failed: {str(e)}"}), 500

    pref = Preference.query.filter_by(user_id=user.id).first()
    if not pref:
        pref = Preference(user_id=user.id)
        db.session.add(pref)

    pref.search_radius_miles = to_int(data.get('search_radius_miles', 10)) or 10
    pref.preferred_gender = data.get('preferred_gender', 'Any') or 'Any'
    pref.preferred_age_min = to_int(data.get('preferred_age_min'))
    pref.preferred_age_max = to_int(data.get('preferred_age_max'))


    pref.my_cleanliness = to_int(data.get('my_cleanliness'))
    pref.pref_cleanliness = to_int(data.get('pref_cleanliness'))
    pref.cleanliness_is_strict = to_bool(data.get('cleanliness_is_strict', False), False)
    pref.cleanliness_do_not_care = to_bool(data.get('cleanliness_do_not_care', False), False)

    pref.my_sleep_schedule = to_int(data.get('my_sleep_schedule'))
    pref.pref_sleep_schedule = to_int(data.get('pref_sleep_schedule'))
    pref.sleep_schedule_is_strict = to_bool(data.get('sleep_schedule_is_strict', False), False)
    pref.sleep_schedule_do_not_care = to_bool(data.get('sleep_schedule_do_not_care', False), False)

    pref.my_noise_tolerance = to_int(data.get('my_noise_tolerance'))
    pref.pref_noise_tolerance = to_int(data.get('pref_noise_tolerance'))
    pref.noise_tolerance_is_strict = to_bool(data.get('noise_tolerance_is_strict', False), False)
    pref.noise_tolerance_do_not_care = to_bool(data.get('noise_tolerance_do_not_care', False), False)

    pref.my_guests_frequency = to_int(data.get('my_guests_frequency'))
    pref.pref_guests_frequency = to_int(data.get('pref_guests_frequency'))
    pref.guests_frequency_is_strict = to_bool(data.get('guests_frequency_is_strict', False), False)
    pref.guests_frequency_do_not_care = to_bool(data.get('guests_frequency_do_not_care', False), False)

    pref.my_smoking = to_int(data.get('my_smoking'))
    pref.pref_smoking = to_int(data.get('pref_smoking'))
    pref.smoking_is_strict = to_bool(data.get('smoking_is_strict', False), False)
    pref.smoking_do_not_care = to_bool(data.get('smoking_do_not_care', False), False)

    pref.my_drinking = to_int(data.get('my_drinking'))
    pref.pref_drinking = to_int(data.get('pref_drinking'))
    pref.drinking_is_strict = to_bool(data.get('drinking_is_strict', False), False)
    pref.drinking_do_not_care = to_bool(data.get('drinking_do_not_care', False), False)

    pref.budget_min = to_int(data.get('budget_min'))
    pref.budget_max = to_int(data.get('budget_max'))
    pref.budget_is_strict = to_bool(data.get('budget_is_strict', False), False)

    has_pets_val = data.get('has_pets')
    pref.has_pets = to_bool(has_pets_val, False) if has_pets_val is not None else None
    pref.pref_no_pets = to_bool(data.get('pref_no_pets', False), False)
    pref.pets_is_strict = to_bool(data.get('pets_is_strict', False), False)

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

    profile_data = {
        "first_name": user.first_name or '',
        "last_name": user.last_name or '',
        "age": user.age if user.age is not None else '',
        "gender": user.gender or 'Prefer not to say',
        "occupation": user.occupation or 'Undergrad',
        "about_me": user.about_me or '',
        "target_country": user.target_country or 'us',
        "zip_code": user.zip_code or '',

        "search_radius_miles": pref.search_radius_miles if pref and pref.search_radius_miles is not None else 10,
        "preferred_gender": pref.preferred_gender if pref and pref.preferred_gender else 'Any',
        "preferred_age_min": pref.preferred_age_min if pref and pref.preferred_age_min is not None else '',
        "preferred_age_max": pref.preferred_age_max if pref and pref.preferred_age_max is not None else '',

        "my_cleanliness": pref.my_cleanliness if pref and pref.my_cleanliness is not None else 3,
        "pref_cleanliness": pref.pref_cleanliness if pref and pref.pref_cleanliness is not None else 3,
        "cleanliness_is_strict": pref.cleanliness_is_strict if pref else False,
        "cleanliness_do_not_care": pref.cleanliness_do_not_care if pref else False,

        "my_sleep_schedule": pref.my_sleep_schedule if pref and pref.my_sleep_schedule is not None else 3,
        "pref_sleep_schedule": pref.pref_sleep_schedule if pref and pref.pref_sleep_schedule is not None else 3,
        "sleep_schedule_is_strict": pref.sleep_schedule_is_strict if pref else False,
        "sleep_schedule_do_not_care": pref.sleep_schedule_do_not_care if pref else False,

        "my_noise_tolerance": pref.my_noise_tolerance if pref and pref.my_noise_tolerance is not None else 3,
        "pref_noise_tolerance": pref.pref_noise_tolerance if pref and pref.pref_noise_tolerance is not None else 3,
        "noise_tolerance_is_strict": pref.noise_tolerance_is_strict if pref else False,
        "noise_tolerance_do_not_care": pref.noise_tolerance_do_not_care if pref else False,

        "my_guests_frequency": pref.my_guests_frequency if pref and pref.my_guests_frequency is not None else 3,
        "pref_guests_frequency": pref.pref_guests_frequency if pref and pref.pref_guests_frequency is not None else 3,
        "guests_frequency_is_strict": pref.guests_frequency_is_strict if pref else False,
        "guests_frequency_do_not_care": pref.guests_frequency_do_not_care if pref else False,

        "my_smoking": pref.my_smoking if pref and pref.my_smoking is not None else 3,
        "pref_smoking": pref.pref_smoking if pref and pref.pref_smoking is not None else 3,
        "smoking_is_strict": pref.smoking_is_strict if pref else False,
        "smoking_do_not_care": pref.smoking_do_not_care if pref else False,

        "my_drinking": pref.my_drinking if pref and pref.my_drinking is not None else 3,
        "pref_drinking": pref.pref_drinking if pref and pref.pref_drinking is not None else 3,
        "drinking_is_strict": pref.drinking_is_strict if pref else False,
        "drinking_do_not_care": pref.drinking_do_not_care if pref else False,

        "budget_min": pref.budget_min if pref and pref.budget_min is not None else '',
        "budget_max": pref.budget_max if pref and pref.budget_max is not None else '',
        "budget_is_strict": pref.budget_is_strict if pref else False,

        "has_pets": pref.has_pets if pref and pref.has_pets is not None else False,
        "pref_no_pets": pref.pref_no_pets if pref and pref.pref_no_pets is not None else False,
        "pets_is_strict": pref.pets_is_strict if pref else False,
    }

    return jsonify(profile_data), 200