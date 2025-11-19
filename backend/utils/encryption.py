from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64

class EncryptionService:
    def __init__(self, encryption_key=None):
        if encryption_key:
            self.key = self._derive_key(encryption_key.encode())
        else:
            self.key = Fernet.generate_key()
        self.cipher = Fernet(self.key)
    
    def _derive_key(self, password, salt=None):
        if salt is None:
            salt = b'securevault_salt_do_not_change!'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
    
    def encrypt(self, plaintext):
        if not plaintext:
            return ""
        try:
            encrypted = self.cipher.encrypt(plaintext.encode())
            return encrypted.decode()
        except Exception as e:
            raise Exception(f"Encryption failed: {str(e)}")
    
    def decrypt(self, encrypted_text):
        if not encrypted_text:
            return ""
        try:
            decrypted = self.cipher.decrypt(encrypted_text.encode())
            return decrypted.decode()
        except Exception as e:
            raise Exception(f"Decryption failed: {str(e)}")

class PasswordStrengthChecker:
    @staticmethod
    def check_strength(password):
        score = 0
        feedback = []
        
        if len(password) >= 8:
            score += 1
        else:
            feedback.append("Password should be at least 8 characters")
        
        if len(password) >= 12:
            score += 1
        
        if any(c.isupper() for c in password) and any(c.islower() for c in password):
            score += 1
        else:
            feedback.append("Add uppercase and lowercase letters")
        
        if any(c.isdigit() for c in password):
            score += 1
        else:
            feedback.append("Add numbers")
        
        if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            score += 1
        else:
            feedback.append("Add special characters")
        
        is_weak = score < 4
        
        return {
            'is_weak': is_weak,
            'score': max(0, score),
            'max_score': 5,
            'feedback': feedback
        }
    
    @staticmethod
    def is_reused(password, existing_passwords):
        return password in existing_passwords

encryption_service = None

def init_encryption_service(encryption_key):
    global encryption_service
    encryption_service = EncryptionService(encryption_key)
    return encryption_service

def get_encryption_service():
    if encryption_service is None:
        raise Exception("Encryption service not initialized")
    return encryption_service