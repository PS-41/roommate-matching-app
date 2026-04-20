from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_
from .models import User, Message, ConnectionRequest
from .extensions import db

messages_bp = Blueprint('messages', __name__, url_prefix='/api/messages')


def are_connected(user_a_id, user_b_id):
    record = ConnectionRequest.query.filter(
        or_(
            and_(ConnectionRequest.sender_id == user_a_id, ConnectionRequest.receiver_id == user_b_id),
            and_(ConnectionRequest.sender_id == user_b_id, ConnectionRequest.receiver_id == user_a_id),
        ),
        ConnectionRequest.status == 'Accepted'
    ).first()

    return record is not None


def serialize_user(user):
    return {
        "user_id": user.id,
        "first_name": user.first_name or user.username,
        "last_name": user.last_name or '',
        "username": user.username,
        "age": user.age,
        "occupation": user.occupation,
    }


@messages_bp.route('/threads', methods=['GET'])
@jwt_required()
def get_threads():
    current_user_id = int(get_jwt_identity())

    accepted_connections = ConnectionRequest.query.filter(
        or_(
            ConnectionRequest.sender_id == current_user_id,
            ConnectionRequest.receiver_id == current_user_id,
        ),
        ConnectionRequest.status == 'Accepted'
    ).order_by(ConnectionRequest.id.desc()).all()

    threads = []

    for record in accepted_connections:
        partner_id = record.receiver_id if record.sender_id == current_user_id else record.sender_id
        partner = User.query.get(partner_id)
        if not partner:
            continue

        latest_message = Message.query.filter(
            or_(
                and_(Message.sender_id == current_user_id, Message.receiver_id == partner_id),
                and_(Message.sender_id == partner_id, Message.receiver_id == current_user_id),
            )
        ).order_by(Message.timestamp.desc()).first()

        unread_count = Message.query.filter_by(
            sender_id=partner_id,
            receiver_id=current_user_id,
            is_read=False
        ).count()

        threads.append({
            "user": serialize_user(partner),
            "latest_message": {
                "content": latest_message.content,
                "timestamp": latest_message.timestamp.isoformat(),
                "sender_id": latest_message.sender_id,
            } if latest_message else None,
            "unread_count": unread_count,
        })

    threads.sort(
        key=lambda t: t["latest_message"]["timestamp"] if t["latest_message"] else "",
        reverse=True
    )

    return jsonify({"threads": threads}), 200


@messages_bp.route('/thread/<int:user_id>', methods=['GET'])
@jwt_required()
def get_thread(user_id):
    current_user_id = int(get_jwt_identity())

    if current_user_id == user_id:
        return jsonify({"error": "You cannot message yourself"}), 400

    partner = User.query.get(user_id)
    if not partner:
        return jsonify({"error": "User not found"}), 404

    if not are_connected(current_user_id, user_id):
        return jsonify({"error": "You can only chat with connected users"}), 403

    messages = Message.query.filter(
        or_(
            and_(Message.sender_id == current_user_id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user_id),
        )
    ).order_by(Message.timestamp.asc()).all()

    unread_messages = Message.query.filter_by(
        sender_id=user_id,
        receiver_id=current_user_id,
        is_read=False
    ).all()

    for msg in unread_messages:
        msg.is_read = True

    db.session.commit()

    return jsonify({
        "user": serialize_user(partner),
        "messages": [
            {
                "id": msg.id,
                "sender_id": msg.sender_id,
                "receiver_id": msg.receiver_id,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat(),
                "is_read": msg.is_read,
            }
            for msg in messages
        ]
    }), 200


@messages_bp.route('/thread/<int:user_id>', methods=['POST'])
@jwt_required()
def send_message(user_id):
    current_user_id = int(get_jwt_identity())

    if current_user_id == user_id:
        return jsonify({"error": "You cannot message yourself"}), 400

    partner = User.query.get(user_id)
    if not partner:
        return jsonify({"error": "User not found"}), 404

    if not are_connected(current_user_id, user_id):
        return jsonify({"error": "You can only chat with connected users"}), 403

    data = request.get_json() or {}
    content = (data.get('content') or '').strip()

    if not content:
        return jsonify({"error": "Message content cannot be empty"}), 400

    new_message = Message(
        sender_id=current_user_id,
        receiver_id=user_id,
        content=content,
        is_read=False,
    )
    db.session.add(new_message)
    db.session.commit()

    return jsonify({
        "message": "Message sent successfully",
        "sent_message": {
            "id": new_message.id,
            "sender_id": new_message.sender_id,
            "receiver_id": new_message.receiver_id,
            "content": new_message.content,
            "timestamp": new_message.timestamp.isoformat(),
            "is_read": new_message.is_read,
        }
    }), 201