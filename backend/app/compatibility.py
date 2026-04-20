from flask import Blueprint, jsonify
from .models import User, Preference, CompatibilityScore, ConnectionRequest
from .extensions import db
from geopy.distance import geodesic
from datetime import datetime, timezone
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_

compatibility_bp = Blueprint('compatibility', __name__, url_prefix='/api/compatibility')

LIFESTYLE_TRAITS = [
    'cleanliness',
    'sleep_schedule',
    'noise_tolerance',
    'guests_frequency',
    'smoking',
    'drinking',
]


def _pair_ids(user_a_id, user_b_id):
    return (min(user_a_id, user_b_id), max(user_a_id, user_b_id))


def _get_score_record(user_a_id, user_b_id):
    id_a, id_b = _pair_ids(user_a_id, user_b_id)
    return CompatibilityScore.query.filter_by(user_a_id=id_a, user_b_id=id_b).first()


def _delete_score_record(user_a_id, user_b_id):
    record = _get_score_record(user_a_id, user_b_id)
    if record:
        db.session.delete(record)


def _upsert_score_record(user_a_id, user_b_id, mutual_score):
    id_a, id_b = _pair_ids(user_a_id, user_b_id)
    record = CompatibilityScore.query.filter_by(user_a_id=id_a, user_b_id=id_b).first()

    if mutual_score is None or mutual_score <= 0:
        if record:
            db.session.delete(record)
        return

    if record:
        record.score = mutual_score
        record.updated_at = datetime.now(timezone.utc)
    else:
        db.session.add(
            CompatibilityScore(
                user_a_id=id_a,
                user_b_id=id_b,
                score=mutual_score,
            )
        )


def _normalized_closeness(diff, max_diff=4):
    score = 1 - (diff / max_diff)
    return max(0.0, min(1.0, score))


def _range_overlap_ratio(min_a, max_a, min_b, max_b):
    overlap_low = max(min_a, min_b)
    overlap_high = min(max_a, max_b)

    if overlap_low > overlap_high:
        return 0.0

    overlap = overlap_high - overlap_low
    union_low = min(min_a, min_b)
    union_high = max(max_a, max_b)
    union = union_high - union_low

    if union <= 0:
        return 1.0

    return max(0.0, min(1.0, overlap / union))


def calculate_directional_score(seeker_user, seeker_pref, candidate_user, candidate_pref):
    """
    Returns a score from 0..100 from the seeker's perspective only.
    Returns None if the candidate violates one of the seeker's hard requirements.
    """
    total_weight = 0.0
    earned_weight = 0.0

    def add_score(score_0_to_1, weight=1.0):
        nonlocal total_weight, earned_weight
        total_weight += weight
        earned_weight += max(0.0, min(1.0, score_0_to_1)) * weight

    # 1. Gender preference (treated as a hard filter if specified)
    preferred_gender = seeker_pref.preferred_gender or 'Any'
    if preferred_gender != 'Any':
        if not candidate_user.gender or candidate_user.gender != preferred_gender:
            return None
        add_score(1.0, weight=1.0)

    # 2. Age preference (treated as a hard filter if specified)
    if seeker_pref.preferred_age_min is not None or seeker_pref.preferred_age_max is not None:
        if candidate_user.age is None:
            return None
        if seeker_pref.preferred_age_min is not None and candidate_user.age < seeker_pref.preferred_age_min:
            return None
        if seeker_pref.preferred_age_max is not None and candidate_user.age > seeker_pref.preferred_age_max:
            return None
        add_score(1.0, weight=1.0)

    # 3. Pets
    if seeker_pref.pref_no_pets:
        candidate_has_pets = bool(candidate_pref.has_pets)
        if candidate_has_pets and seeker_pref.pets_is_strict:
            return None
        add_score(0.0 if candidate_has_pets else 1.0, weight=1.0)

    # 4. Budget
    if (
        seeker_pref.budget_min is not None and seeker_pref.budget_max is not None and
        candidate_pref.budget_min is not None and candidate_pref.budget_max is not None
    ):
        overlap_ratio = _range_overlap_ratio(
            seeker_pref.budget_min,
            seeker_pref.budget_max,
            candidate_pref.budget_min,
            candidate_pref.budget_max,
        )

        if overlap_ratio == 0.0 and seeker_pref.budget_is_strict:
            return None

        add_score(overlap_ratio, weight=1.0)

    # 5. Lifestyle traits
    for trait in LIFESTYLE_TRAITS:
        do_not_care = getattr(seeker_pref, f'{trait}_do_not_care', False)
        if do_not_care:
            continue

        preferred_value = getattr(seeker_pref, f'pref_{trait}', None)
        candidate_actual = getattr(candidate_pref, f'my_{trait}', None)
        is_strict = getattr(seeker_pref, f'{trait}_is_strict', False)

        if preferred_value is None or candidate_actual is None:
            continue

        diff = abs(preferred_value - candidate_actual)

        if is_strict and diff > 1:
            return None

        add_score(_normalized_closeness(diff), weight=1.0)

    if total_weight == 0:
        return 50.0

    return round((earned_weight / total_weight) * 100, 1)


def calculate_pair_mutual_score(user_a, pref_a, user_b, pref_b):
    """
    One-row mutual score:
    - location/radius is always a hard mutual filter
    - directional score is calculated both ways
    - final score is the average of both directional scores
    Returns None if incompatible.
    """
    if (
        not user_a or not user_b or
        not pref_a or not pref_b or
        user_a.latitude is None or user_a.longitude is None or
        user_b.latitude is None or user_b.longitude is None
    ):
        return None

    coords_a = (user_a.latitude, user_a.longitude)
    coords_b = (user_b.latitude, user_b.longitude)
    distance_miles = geodesic(coords_a, coords_b).miles

    # Location is always strict from both sides
    if distance_miles > pref_a.search_radius_miles or distance_miles > pref_b.search_radius_miles:
        return None

    score_ab = calculate_directional_score(user_a, pref_a, user_b, pref_b)
    if score_ab is None:
        return None

    score_ba = calculate_directional_score(user_b, pref_b, user_a, pref_a)
    if score_ba is None:
        return None

    mutual_score = round((score_ab + score_ba) / 2.0, 1)

    if mutual_score <= 0:
        return None

    return mutual_score


def delete_all_scores_for_user(user_id):
    CompatibilityScore.query.filter(
        (CompatibilityScore.user_a_id == user_id) |
        (CompatibilityScore.user_b_id == user_id)
    ).delete(synchronize_session=False)


def update_user_matches(user_id):
    """
    Recomputes the given user's compatibility against everyone else.
    This function also removes stale rows when a pair becomes incompatible.
    Because there is only ONE row per pair, updating this user refreshes the
    dashboard ranking for both sides.
    """
    user = User.query.get(user_id)
    user_pref = Preference.query.filter_by(user_id=user_id).first()

    # If this user is not currently matchable, wipe all of their cached rows.
    if (
        not user or
        not user_pref or
        user.latitude is None or
        user.longitude is None
    ):
        delete_all_scores_for_user(user_id)
        db.session.commit()
        return

    partners = User.query.filter(User.id != user_id).all()

    for partner in partners:
        partner_pref = Preference.query.filter_by(user_id=partner.id).first()

        mutual_score = calculate_pair_mutual_score(user, user_pref, partner, partner_pref)
        _upsert_score_record(user.id, partner.id, mutual_score)

    db.session.commit()


def rebuild_all_compatibility_scores():
    """
    One-time helper you can call manually after deploying this new engine.
    It clears the cache and rebuilds it for every user.
    """
    CompatibilityScore.query.delete(synchronize_session=False)
    db.session.commit()

    all_users = User.query.all()
    for user in all_users:
        update_user_matches(user.id)


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


@compatibility_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)

    if not current_user or current_user.latitude is None or current_user.longitude is None:
        return jsonify([]), 200

    current_coords = (current_user.latitude, current_user.longitude)

    scores = CompatibilityScore.query.filter(
        ((CompatibilityScore.user_a_id == current_user_id) |
         (CompatibilityScore.user_b_id == current_user_id)) &
        (CompatibilityScore.score > 0)
    ).order_by(CompatibilityScore.score.desc()).all()

    recommendations = []
    for score_record in scores:
        partner_id = (
            score_record.user_b_id
            if score_record.user_a_id == current_user_id
            else score_record.user_a_id
        )
        partner = User.query.get(partner_id)
        partner_pref = Preference.query.filter_by(user_id=partner_id).first()

        if (
            not partner or
            not partner_pref or
            partner.latitude is None or
            partner.longitude is None
        ):
            continue

        # Extra safety: if stale data ever slips through, skip it here.
        recalculated = calculate_pair_mutual_score(
            current_user,
            Preference.query.filter_by(user_id=current_user_id).first(),
            partner,
            partner_pref
        )
        if recalculated is None:
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