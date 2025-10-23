import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

engine = create_engine(DATABASE_URL)

def check_users():
    print("Checking users in database...")
    with engine.connect() as connection:
        # Check users table
        result = connection.execute(text("""
            SELECT 
                id,
                email,
                first_name,
                last_name,
                role,
                phone,
                phone_country_code,
                location,
                bio,
                linkedin_url,
                resume_filename,
                resume_url,
                resume_key
            FROM users
            ORDER BY created_at DESC
        """))
        
        users = result.fetchall()
        
        if not users:
            print("❌ No users found in database")
        else:
            print(f"✅ Found {len(users)} user(s):")
            for i, user in enumerate(users, 1):
                print(f"\n--- User {i} ---")
                print(f"ID: {user.id}")
                print(f"Email: {user.email}")
                print(f"Name: {user.first_name} {user.last_name}")
                print(f"Role: {user.role}")
                print(f"Phone: {user.phone_country_code} {user.phone}")
                print(f"Location: {user.location}")
                print(f"Bio: {user.bio}")
                print(f"LinkedIn: {user.linkedin_url}")
                print(f"Resume: {user.resume_filename}")

if __name__ == "__main__":
    check_users()




