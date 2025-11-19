from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
from models import db
from utils.encryption import init_encryption_service
import os

def create_app(config_name='development'):
    app = Flask(__name__)
    
    app.config.from_object(config[config_name])
    
    db.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    jwt = JWTManager(app)
    
    init_encryption_service(app.config['ENCRYPTION_KEY'])
    
    from routes.auth import auth_bp
    from routes.passwords import passwords_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(passwords_bp)
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"Invalid token error: {error}")
        return jsonify({'error': 'Invalid token'}), 401

    @jwt.unauthorized_loader  
    def missing_token_callback(error):
        print(f"Missing token error: {os.error}")
        return jsonify({'error': 'Authorization token is missing'}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        print(f"Revoked token - Header: {jwt_header}, Payload: {jwt_payload}")
        return jsonify({'error': 'Token has been revoked'}), 401
    
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'SecureVault API'
        }), 200
    
    @app.route('/', methods=['GET'])
    def index():
        return jsonify({
            'message': 'Welcome to SecureVault API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'passwords': '/api/passwords',
                'health': '/health'
            }
        }), 200
    
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    app.run(host='0.0.0.0', port=5000, debug=True)