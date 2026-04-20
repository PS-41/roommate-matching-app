from flask import Blueprint, jsonify
from .models import User, Preference, CompatibilityScore
from .extensions import db
from geopy.distance import geodesic
from datetime import datetime, timezone
from flask_jwt_extended import jwt_required, get_jwt_identity

compatibility_bp = Blueprint('compatibility', __name__, url_prefix='/api/compatibility')

def calculate_mutual_score(pref_a, pref_b):
    """
    Calculates a mutual compatibility score between 0 and 100.
    Returns 0 if a strict dealbreaker is violated.
    """
    score = 100.0
    total_weight = 0
    earned_weight = 0

    # Helper function to evaluate a specific lifestyle parameter
    def evaluate_param(my_val, pref_val, is_strict, partner_my_val, partner_pref_val, partner_strict):
        nonlocal earned_weight, total_weight
        
        # If either doesn't care, we skip penalizing but don't add weight
        if pref_val is None or partner_my_val is None:
            return True
            
        diff_a = abs(pref_val - partner_my_val)
        diff_b = abs(partner_pref_val - my_val) if partner_pref_val is not None and my_val is not None else 0

        # Dealbreaker check
        if is_strict and diff_a > 1: return False
        if partner_strict and diff_b > 1: return False

        # Add to weighted score (closer to 0 diff is better)
        total_weight += 20
        earned_weight += max(0, 10 - (diff_a * 2.5)) + max(0, 10 - (diff_b * 2.5))
        return True

    # 1. Cleanliness
    if not evaluate_param(
        pref_a.my_cleanliness, pref_a.pref_cleanliness, pref_a.cleanliness_is_strict,
        pref_b.my_cleanliness, pref_b.pref_cleanliness, pref_b.cleanliness_is_strict
    ): return 0.0

    # 2. Sleep Schedule
    if not evaluate_param(
        pref_a.my_sleep_schedule, pref_a.pref_sleep_schedule, pref_a.sleep_schedule_is_strict,
        pref_b.my_sleep_schedule, pref_b.pref_sleep_schedule, pref_b.sleep_schedule_is_strict
    ): return 0.0

    # (You can easily add the rest of your 30 parameters here using the same evaluate_param format)

    if total_weight == 0:
        return 50.0 # Default base score if no preferences are set
        
    return (earned_weight / total_weight) * 100


def update_user_matches(user_id):
    """
    Finds all potential matches for a user within their radius and updates the cache.
    """
    user = User.query.get(user_id)
    user_pref = Preference.query.filter_by(user_id=user_id).first()
    
    if not user or not user_pref or not user.latitude or not user.longitude:
        return

    user_coords = (user.latitude, user.longitude)
    all_other_users = User.query.filter(User.id != user_id).all()

    for partner in all_other_users:
        partner_pref = Preference.query.filter_by(user_id=partner.id).first()
        if not partner_pref or not partner.latitude or not partner.longitude:
            continue
            
        partner_coords = (partner.latitude, partner.longitude)
        
        # 1. Check Distance
        distance_miles = geodesic(user_coords, partner_coords).miles
        if distance_miles > user_pref.search_radius_miles or distance_miles > partner_pref.search_radius_miles:
            continue # Outside of someone's search radius

        # 2. Calculate Score
        mutual_score = calculate_mutual_score(user_pref, partner_pref)
        
        # 3. Save to Database (Enforce user_a_id < user_b_id)
        id_a, id_b = min(user.id, partner.id), max(user.id, partner.id)
        
        score_record = CompatibilityScore.query.filter_by(user_a_id=id_a, user_b_id=id_b).first()
        
        if score_record:
            score_record.score = mutual_score
            score_record.updated_at = datetime.now(timezone.utc)
        else:
            new_record = CompatibilityScore(user_a_id=id_a, user_b_id=id_b, score=mutual_score)
            db.session.add(new_record)

    db.session.commit()

@compatibility_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # If the user hasn't set their location yet, return an empty list
    if not current_user or not current_user.latitude or not current_user.longitude:
        return jsonify([]), 200
        
    current_coords = (current_user.latitude, current_user.longitude)

    # Fetch all scores where the current user is either A or B, highest score first
    scores = CompatibilityScore.query.filter(
        (CompatibilityScore.user_a_id == current_user_id) | 
        (CompatibilityScore.user_b_id == current_user_id)
    ).order_by(CompatibilityScore.score.desc()).all()

    recommendations = []
    for score_record in scores:
        # Determine which ID is the partner
        partner_id = score_record.user_b_id if score_record.user_a_id == current_user_id else score_record.user_a_id
        partner = User.query.get(partner_id)
        
        if not partner or not partner.latitude or not partner.longitude:
            continue
            
        # Calculate exactly how far away they are to display on the UI
        partner_coords = (partner.latitude, partner.longitude)
        distance = round(geodesic(current_coords, partner_coords).miles, 1)

        recommendations.append({
            "user_id": partner.id,
            "first_name": partner.first_name or partner.username,
            "age": partner.age,
            "gender": partner.gender,
            "occupation": partner.occupation,
            "about_me": partner.about_me,
            "compatibility_score": round(score_record.score, 1),
            "distance_miles": distance
        })

    return jsonify(recommendations), 200