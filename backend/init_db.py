from app import create_app
from models import db, User, Password
from utils.encryption import get_encryption_service
import sys

def init_db():
    app = create_app()
    
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✓ Database tables created successfully!")
        
        admin = User.query.filter_by(email='admin@securevault.com').first()
        if not admin:
            print("\nCreating demo admin user...")
            admin = User(email='admin@securevault.com')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("✓ Demo admin user created!")
            print("  Email: admin@securevault.com")
            print("  Password: admin123")
        
        print("\n✓ Database initialization complete!")

def seed_demo_data():
    app = create_app()
    
    with app.app_context():
        print("\nSeeding demo data...")
        
        demo_user = User.query.filter_by(email='demo@securevault.com').first()
        if not demo_user:
            demo_user = User(email='demo@securevault.com')
            demo_user.set_password('demo123')
            db.session.add(demo_user)
            db.session.commit()
            print("✓ Demo user created (demo@securevault.com / demo123)")
        
        existing_passwords = Password.query.filter_by(user_id=demo_user.id).count()
        if existing_passwords > 0:
            print("Demo data already exists. Skipping...")
            return
        
        encryption_service = get_encryption_service()
        
        demo_passwords = [
            {
                'service_name': 'Google',
                'website_url': 'https://google.com',
                'email_address': 'personal@gmail.com',
                'password': 'MyG00gleP@ss!',
                'notes': 'Personal Google account',
                'category': 'Personal',
                'is_weak': False,
                'is_reused': False
            },
            {
                'service_name': 'GitHub',
                'website_url': 'https://github.com',
                'username': 'john.doe@email.com',
                'password': 'GitHubSecure2024!',
                'notes': '',
                'category': 'Work',
                'is_weak': False,
                'is_reused': False
            }
        ]
        
        for pwd_data in demo_passwords:
            password_text = pwd_data.pop('password')
            encrypted_password = encryption_service.encrypt(password_text)
            
            password = Password(
                user_id=demo_user.id,
                encrypted_password=encrypted_password,
                **pwd_data
            )
            db.session.add(password)
        
        db.session.commit()
        print(f" Created {len(demo_passwords)} demo passwords")
        print("\n Demo data seeding complete!")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'init':
            init_db()
        elif command == 'seed':
            seed_demo_data()
        else:
            print(f"Unknown command: {command}")
            print("Available commands: init, seed")
    else:
        print("Usage: python init_db.py [command]")
        print("Commands:")
        print("  init  - Initialize database tables")
        print("  seed  - Seed demo data")