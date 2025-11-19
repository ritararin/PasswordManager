from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    passwords = db.relationship('Password', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Password(db.Model):
    __tablename__ = 'passwords'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    service_name = db.Column(db.String(100), nullable=False)
    website_url = db.Column(db.String(500))
    username = db.Column(db.String(255))
    email_address = db.Column(db.String(255))
    encrypted_password = db.Column(db.Text, nullable=False)
    notes = db.Column(db.Text)
    category = db.Column(db.String(50), default='Personal')
    is_weak = db.Column(db.Boolean, default=False)
    is_reused = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used = db.Column(db.DateTime)
    
    def to_dict(self, include_password=False):
        data = {
            'id': self.id,
            'service_name': self.service_name,
            'website_url': self.website_url,
            'username': self.username,
            'email_address': self.email_address,
            'notes': self.notes,
            'category': self.category,
            'is_weak': self.is_weak,
            'is_reused': self.is_reused,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_used': self.last_used.isoformat() if self.last_used else None
        }
        if include_password:
            data['encrypted_password'] = self.encrypted_password
        return data