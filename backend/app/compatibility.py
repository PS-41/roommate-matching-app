from flask import Blueprint, jsonify
from .models import User, Preference, CompatibilityScore, ConnectionRequest
from .extensions import db
from geopy.distance import geodesic
from datetime import datetime, timezone
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_

compatibility_bp = Blueprint('compatibility', __name__, url_prefix='/api/compatibility')


def calculate_mutual_score(pref_a, pref_b):
    """
    Calculates a mutual compatibility score between 0 and 100.
    Returns 0 if a strict dealbreaker is violated.
    """
    total_weight = 0
    earned_weight = 0

    def evaluate_param(my_val, pref_val, is_strict, do_not_care, partner_my_val, partner_pref_val, partner_strict, partner_do_not_care):
        nonlocal earned_weight, total_weight

        if do_not_care or partner_do_not_care:
            return True

        if pref_val is None or partner_my_val is None:
            return True

        diff_a = abs(pref_val - partner_my_val)
        diff_b = abs(partner_pref_val - my_val) if partner_pref_val is not None and my_val is not None else 0

        if is_strict and diff_a > 1:
            return False
        if partner_strict and diff_b > 1:
            return False

        total_weight += 20
        earned_weight += max(0, 10 - (diff_a * 2.5)) + max(0, 10 - (diff_b * 2.5))
        return True

    def budget_overlap(min_a, max_a, strict_a, min_b, max_b, strict_b):
        nonlocal earned_weight, total_weight

        if min_a is None or max_a is None or min_b is None or max_b is None:
            return True

        overlap_low = max(min_a, min_b)
        overlap_high = min(max_a, max_b)
        has_overlap = overlap_low <= overlap_high

        if (strict_a or strict_b) and not has_overlap:
            return False

        total_weight += 20
        earned_weight += 20 if has_overlap else 0
        return True

    def basic_preference_checks(user_a, pref_a, user_b, pref_b):
        if pref_a.preferred_gender and pref_a.preferred_gender != 'Any':
            if not user_b.gender or user_b.gender != pref_a.preferred_gender:
                return False

        if pref_b.preferred_gender and pref_b.preferred_gender != 'Any':
            if not user_a.gender or user_a.gender != pref_b.preferred_gender:
                return False

        if pref_a.preferred_age_min is not None:
            if user_b.age is None or user_b.age < pref_a.preferred_age_min:
                return False
        if pref_a.preferred_age_max is not None:
            if user_b.age is None or user_b.age > pref_a.preferred_age_max:
                return False

        if pref_b.preferred_age_min is not None:
            if user_a.age is None or user_a.age < pref_b.preferred_age_min:
                return False
        if pref_b.preferred_age_max is not None:
            if user_a.age is None or user_a.age > pref_b.preferred_age_max:
                return False

        if pref_a.pets_is_strict and pref_a.pref_no_pets and pref_b.has_pets:
            return False
        if pref_b.pets_is_strict and pref_b.pref_no_pets and pref_a.has_pets:
            return False

        return True

    # These checks are outside the weighted scoring
    # We access user-level fields elsewhere in update_user_matches.
    # This function focuses on Preference data only.

    # 1. Cleanliness
    if not evaluate_param(
        pref_a.my_cleanliness, pref_a.pref_cleanliness, pref_a.cleanliness_is_strict, pref_a.cleanliness_do_not_care,
        pref_b.my_cleanliness, pref_b.pref_cleanliness, pref_b.cleanliness_is_strict, pref_b.cleanliness_do_not_care
    ):
        return 0.0

    # 2. Sleep Schedule
    if not evaluate_param(
        pref_a.my_sleep_schedule, pref_a.pref_sleep_schedule, pref_a.sleep_schedule_is_strict, pref_a.sleep_schedule_do_not_care,
        pref_b.my_sleep_schedule, pref_b.pref_sleep_schedule, pref_b.sleep_schedule_is_strict, pref_b.sleep_schedule_do_not_care
    ):
        return 0.0

    # 3. Noise Tolerance
    if not evaluate_param(
        pref_a.my_noise_tolerance, pref_a.pref_noise_tolerance, pref_a.noise_tolerance_is_strict, pref_a.noise_tolerance_do_not_care,
        pref_b.my_noise_tolerance, pref_b.pref_noise_tolerance, pref_b.noise_tolerance_is_strict, pref_b.noise_tolerance_do_not_care
    ):
        return 0.0

    # 4. Guests
    if not evaluate_param(
        pref_a.my_guests_frequency, pref_a.pref_guests_frequency, pref_a.guests_frequency_is_strict, pref_a.guests_frequency_do_not_care,
        pref_b.my_guests_frequency, pref_b.pref_guests_frequency, pref_b.guests_frequency_is_strict, pref_b.guests_frequency_do_not_care
    ):
        return 0.0

    # 5. Smoking
    if not evaluate_param(
        pref_a.my_smoking, pref_a.pref_smoking, pref_a.smoking_is_strict, pref_a.smoking_do_not_care,
        pref_b.my_smoking, pref_b.pref_smoking, pref_b.smoking_is_strict, pref_b.smoking_do_not_care
    ):
        return 0.0

    # 6. Drinking
    if not evaluate_param(
        pref_a.my_drinking, pref_a.pref_drinking, pref_a.drinking_is_strict, pref_a.drinking_do_not_care,
        pref_b.my_drinking, pref_b.pref_drinking, pref_b.drinking_is_strict, pref_b.drinking_do_not_care
    ):
        return 0.0

    # 7. Budget overlap
    if not budget_overlap(
        pref_a.budget_min, pref_a.budget_max, pref_a.budget_is_strict,
        pref_b.budget_min, pref_b.budget_max, pref_b.budget_is_strict
    ):
        return 0.0

    if total_weight == 0:
        return 50.0

    return round((earned_weight / total_weight) * 100, 1)


def get_connection_record(user_a_id, user_b_id):
    return ConnectionRequest.query.filter(
        or_(
            and_(ConnectionRequest.sender_id == user_a_id, ConnectionRequest.receiver_id == user_b_id),
            and_(ConnectionRequest.sender_id == user_b_id, ConnectionRequest.receiver_id == user_a_id),
        )
    ).order_by(ConnectionRequest.id.desc()).first()


def get_connection_status(current_user_id, other_user_id):
    record = get_connection_record(current_user_id, other_user_id)

    if not record:
        return "none"

    if record.status == 'Accepted':
        return "connected"

    if record.status == 'Pending':
        if record.sender_id == current_user_id:
            return "pending_outgoing"
        return "pending_incoming"

    return "none"


def serialize_connection_user(user, status):
    return {
        "user_id": user.id,
        "first_name": user.first_name or user.username,
        "last_name": user.last_name or '',
        "age": user.age,
        "gender": user.gender,
        "occupation": user.occupation,
        "about_me": user.about_me,
        "status": status,
    }


def update_user_matches(user_id):
    """
    Finds all potential matches for a user within their radius and updates the cache.
    """
    user = User.query.get(user_id)
    user_pref = Preference.query.filter_by(user_id=user_id).first()

    if not user or not user_pref or user.latitude is None or user.longitude is None:
        return

    user_coords = (user.latitude, user.longitude)
    all_other_users = User.query.filter(User.id != user_id).all()

    for partner in all_other_users:
        partner_pref = Preference.query.filter_by(user_id=partner.id).first()
        if not partner_pref or partner.latitude is None or partner.longitude is None:
            continue

        if not (
            (user_pref.preferred_gender in [None, '', 'Any'] or partner.gender == user_pref.preferred_gender)
            and (partner_pref.preferred_gender in [None, '', 'Any'] or user.gender == partner_pref.preferred_gender)
        ):
            continue

        if user_pref.preferred_age_min is not None and (partner.age is None or partner.age < user_pref.preferred_age_min):
            continue
        if user_pref.preferred_age_max is not None and (partner.age is None or partner.age > user_pref.preferred_age_max):
            continue
        if partner_pref.preferred_age_min is not None and (user.age is None or user.age < partner_pref.preferred_age_min):
            continue
        if partner_pref.preferred_age_max is not None and (user.age is None or user.age > partner_pref.preferred_age_max):
            continue

        if user_pref.pets_is_strict and user_pref.pref_no_pets and partner_pref.has_pets:
            continue
        if partner_pref.pets_is_strict and partner_pref.pref_no_pets and user_pref.has_pets:
            continue

        partner_coords = (partner.latitude, partner.longitude)

        distance_miles = geodesic(user_coords, partner_coords).miles
        if distance_miles > user_pref.search_radius_miles or distance_miles > partner_pref.search_radius_miles:
            continue

        mutual_score = calculate_mutual_score(user_pref, partner_pref)

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

    if not current_user or current_user.latitude is None or current_user.longitude is None:
        return jsonify([]), 200

    current_coords = (current_user.latitude, current_user.longitude)

    scores = CompatibilityScore.query.filter(
        (CompatibilityScore.user_a_id == current_user_id) |
        (CompatibilityScore.user_b_id == current_user_id)
    ).order_by(CompatibilityScore.score.desc()).all()

    recommendations = []
    for score_record in scores:
        partner_id = score_record.user_b_id if score_record.user_a_id == current_user_id else score_record.user_a_id
        partner = User.query.get(partner_id)

        if not partner or partner.latitude is None or partner.longitude is None:
            continue

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
            "distance_miles": distance,
            "connection_status": get_connection_status(current_user_id, partner.id),
        })

    return jsonify(recommendations), 200


@compatibility_bp.route('/connections/status/<int:user_id>', methods=['GET'])
@jwt_required()
def connection_status(user_id):
    current_user_id = int(get_jwt_identity())

    if current_user_id == user_id:
        return jsonify({"status": "self"}), 200

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"status": get_connection_status(current_user_id, user_id)}), 200


@compatibility_bp.route('/connections/request/<int:user_id>', methods=['POST'])
@jwt_required()
def send_connection_request(user_id):
    current_user_id = int(get_jwt_identity())

    if current_user_id == user_id:
        return jsonify({"error": "You cannot connect with yourself"}), 400

    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    record = get_connection_record(current_user_id, user_id)

    if record:
        if record.status == 'Accepted':
            return jsonify({"error": "You are already connected"}), 400

        if record.status == 'Pending':
            if record.sender_id == current_user_id:
                return jsonify({"error": "Connection request already sent"}), 400
            return jsonify({"error": "This user has already sent you a request"}), 400

        record.sender_id = current_user_id
        record.receiver_id = user_id
        record.status = 'Pending'
        record.created_at = datetime.now(timezone.utc)
    else:
        record = ConnectionRequest(
            sender_id=current_user_id,
            receiver_id=user_id,
            status='Pending',
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(record)

    db.session.commit()
    return jsonify({"message": "Connection request sent successfully"}), 200


@compatibility_bp.route('/connections/accept/<int:user_id>', methods=['POST'])
@jwt_required()
def accept_connection_request(user_id):
    current_user_id = int(get_jwt_identity())
    record = get_connection_record(current_user_id, user_id)

    if not record or record.status != 'Pending':
        return jsonify({"error": "No pending connection request found"}), 404

    if record.receiver_id != current_user_id:
        return jsonify({"error": "Only the receiver can accept this request"}), 403

    record.status = 'Accepted'
    db.session.commit()

    return jsonify({"message": "Connection request accepted"}), 200


@compatibility_bp.route('/connections/decline/<int:user_id>', methods=['POST'])
@jwt_required()
def decline_connection_request(user_id):
    current_user_id = int(get_jwt_identity())
    record = get_connection_record(current_user_id, user_id)

    if not record or record.status != 'Pending':
        return jsonify({"error": "No pending connection request found"}), 404

    if record.receiver_id != current_user_id:
        return jsonify({"error": "Only the receiver can decline this request"}), 403

    record.status = 'Declined'
    db.session.commit()

    return jsonify({"message": "Connection request declined"}), 200


@compatibility_bp.route('/connections/remove/<int:user_id>', methods=['POST'])
@jwt_required()
def remove_connection(user_id):
    current_user_id = int(get_jwt_identity())
    record = get_connection_record(current_user_id, user_id)

    if not record:
        return jsonify({"error": "No connection record found"}), 404

    if record.status == 'Accepted':
        record.status = 'Removed'
        db.session.commit()
        return jsonify({"message": "Connection removed"}), 200

    if record.status == 'Pending' and record.sender_id == current_user_id:
        record.status = 'Removed'
        db.session.commit()
        return jsonify({"message": "Connection request withdrawn"}), 200

    return jsonify({"error": "This action is not allowed"}), 400


@compatibility_bp.route('/connections', methods=['GET'])
@jwt_required()
def get_connections():
    current_user_id = int(get_jwt_identity())

    records = ConnectionRequest.query.filter(
        or_(
            ConnectionRequest.sender_id == current_user_id,
            ConnectionRequest.receiver_id == current_user_id
        )
    ).order_by(ConnectionRequest.id.desc()).all()

    connected = []
    incoming = []
    outgoing = []

    for record in records:
        if record.status not in ['Accepted', 'Pending']:
            continue

        partner_id = record.receiver_id if record.sender_id == current_user_id else record.sender_id
        partner = User.query.get(partner_id)
        if not partner:
            continue

        if record.status == 'Accepted':
            connected.append(serialize_connection_user(partner, 'connected'))
        elif record.status == 'Pending':
            if record.receiver_id == current_user_id:
                incoming.append(serialize_connection_user(partner, 'pending_incoming'))
            else:
                outgoing.append(serialize_connection_user(partner, 'pending_outgoing'))

    return jsonify({
        "connected": connected,
        "incoming_requests": incoming,
        "outgoing_requests": outgoing,
    }), 200