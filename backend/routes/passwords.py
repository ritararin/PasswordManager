from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Password
from utils.encryption import get_encryption_service, PasswordStrengthChecker
from datetime import datetime
import secrets
import string

passwords_bp = Blueprint('passwords', __name__, url_prefix='/api/passwords')

@passwords_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_passwords():
    try:
        print("=== GET ALL PASSWORDS ===")
        current_user_id = int(get_jwt_identity())
        print(f"Current user ID: {current_user_id}")
        
        category = request.args.get('category')
        search = request.args.get('search')
        
        query = Password.query.filter_by(user_id=current_user_id)
        
        if category:
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(
                db.or_(
                    Password.service_name.ilike(f'%{search}%'),
                    Password.username.ilike(f'%{search}%'),
                    Password.email_address.ilike(f'%{search}%')
                )
            )
        
        passwords = query.order_by(Password.updated_at.desc()).all()
        print(f"Found {len(passwords)} passwords")
        
        return jsonify({
            'passwords': [p.to_dict() for p in passwords],
            'count': len(passwords)
        }), 200
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch passwords: {str(e)}'}), 500

@passwords_bp.route('/<int:password_id>/', methods=['GET'])
@jwt_required()
def get_password(password_id):
    try:
        current_user_id = int(get_jwt_identity())
        password = Password.query.filter_by(id=password_id, user_id=current_user_id).first()
        
        if not password:
            return jsonify({'error': 'Password not found'}), 404
        
        encryption_service = get_encryption_service()
        decrypted_password = encryption_service.decrypt(password.encrypted_password)
        
        password.last_used = datetime.utcnow()
        db.session.commit()
        
        password_dict = password.to_dict()
        password_dict['password'] = decrypted_password
        
        return jsonify(password_dict), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch password: {str(e)}'}), 500

@passwords_bp.route('/', methods=['POST'])
@jwt_required()
def create_password():
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        service_name = data.get('service_name', '').strip()
        password_text = data.get('password', '')
        
        if not service_name or not password_text:
            return jsonify({'error': 'Service name and password are required'}), 400
        
        encryption_service = get_encryption_service()
        encrypted_password = encryption_service.encrypt(password_text)
        
        strength = PasswordStrengthChecker.check_strength(password_text)
        
        existing_passwords = Password.query.filter_by(user_id=current_user_id).all()
        decrypted_passwords = []
        for p in existing_passwords:
            try:
                decrypted = encryption_service.decrypt(p.encrypted_password)
                decrypted_passwords.append(decrypted)
            except:
                continue
        
        is_reused = PasswordStrengthChecker.is_reused(password_text, decrypted_passwords)
        
        password = Password(
            user_id=current_user_id,
            service_name=service_name,
            website_url=data.get('website_url', '').strip(),
            username=data.get('username', '').strip(),
            email_address=data.get('email_address', '').strip(),
            encrypted_password=encrypted_password,
            notes=data.get('notes', ''),
            category=data.get('category', 'Personal'),
            is_weak=strength['is_weak'],
            is_reused=is_reused
        )
        
        db.session.add(password)
        db.session.commit()
        
        return jsonify({
            'message': 'Password created successfully',
            'password': password.to_dict(),
            'strength': strength
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create password: {str(e)}'}), 500

@passwords_bp.route('/<int:password_id>/', methods=['DELETE'])
@jwt_required()
def delete_password(password_id):
    try:
        current_user_id = int(get_jwt_identity())
        password = Password.query.filter_by(id=password_id, user_id=current_user_id).first()
        
        if not password:
            return jsonify({'error': 'Password not found'}), 404
        
        db.session.delete(password)
        db.session.commit()
        
        return jsonify({'message': 'Password deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete password: {str(e)}'}), 500

@passwords_bp.route('/security-health/', methods=['GET'])
@jwt_required()
def get_security_health():
    try:
        current_user_id = int(get_jwt_identity())
        passwords = Password.query.filter_by(user_id=current_user_id).all()
        
        total_passwords = len(passwords)
        weak_passwords = sum(1 for p in passwords if p.is_weak)
        reused_passwords = sum(1 for p in passwords if p.is_reused)
        
        if total_passwords == 0:
            score = 100
        else:
            weak_penalty = (weak_passwords / total_passwords) * 40
            reused_penalty = (reused_passwords / total_passwords) * 60
            score = max(0, 100 - weak_penalty - reused_penalty)
        
        return jsonify({
            'total_passwords': total_passwords,
            'weak_passwords': weak_passwords,
            'reused_passwords': reused_passwords,
            'security_score': int(score)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get security health: {str(e)}'}), 500

@passwords_bp.route('/generate/', methods=['GET'])
def generate_password():
    try:
        length = int(request.args.get('length', 16))
        include_special = request.args.get('include_special', 'true').lower() == 'true'
        
        length = max(8, min(64, length))
        
        lowercase = string.ascii_lowercase
        uppercase = string.ascii_uppercase
        digits = string.digits
        special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        password = [
            secrets.choice(lowercase),
            secrets.choice(uppercase),
            secrets.choice(digits)
        ]
        
        if include_special:
            password.append(secrets.choice(special))
            all_chars = lowercase + uppercase + digits + special
        else:
            all_chars = lowercase + uppercase + digits
        
        for _ in range(length - len(password)):
            password.append(secrets.choice(all_chars))
        
        secrets.SystemRandom().shuffle(password)
        generated_password = ''.join(password)
        
        strength = PasswordStrengthChecker.check_strength(generated_password)
        
        return jsonify({
            'password': generated_password,
            'strength': strength
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate password: {str(e)}'}), 500