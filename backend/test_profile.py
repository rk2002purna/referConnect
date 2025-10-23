#!/usr/bin/env python3
"""
Test script to check jobseeker profile creation and retrieval
"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.models.user import JobSeeker, User
from app.schemas.profile import JobSeekerProfileUpdateRequest

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL environment variable not set")
    sys.exit(1)

print(f"🔍 Database URL: {DATABASE_URL}")

# Create database connection
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_jobseeker_profile():
    """Test jobseeker profile creation and retrieval"""
    print("\n🧪 Testing Jobseeker Profile...")
    
    with SessionLocal() as db:
        # Check if there are any users
        users = db.execute(text("SELECT id, email, role FROM users ORDER BY id DESC LIMIT 5")).fetchall()
        print(f"📊 Found {len(users)} users:")
        for user in users:
            print(f"  - ID: {user[0]}, Email: {user[1]}, Role: {user[2]}")
        
        # Check if there are any jobseekers
        jobseekers = db.execute(text("SELECT user_id, current_company, current_job_title FROM job_seekers ORDER BY user_id DESC LIMIT 5")).fetchall()
        print(f"📊 Found {len(jobseekers)} jobseekers:")
        for jobseeker in jobseekers:
            print(f"  - User ID: {jobseeker[0]}, Company: {jobseeker[1]}, Title: {jobseeker[2]}")
        
        # Check if there are any jobseekers for the latest user
        if users:
            latest_user = users[0]
            print(f"\n🔍 Checking jobseeker profile for user {latest_user[0]} ({latest_user[1]})...")
            
            jobseeker_profile = db.execute(
                text("SELECT * FROM job_seekers WHERE user_id = :user_id"),
                {"user_id": latest_user[0]}
            ).fetchone()
            
            if jobseeker_profile:
                print("✅ Jobseeker profile found!")
                print(f"  - Company: {jobseeker_profile[3] if len(jobseeker_profile) > 3 else 'N/A'}")
                print(f"  - Title: {jobseeker_profile[4] if len(jobseeker_profile) > 4 else 'N/A'}")
                print(f"  - Skills: {jobseeker_profile[5] if len(jobseeker_profile) > 5 else 'N/A'}")
            else:
                print("❌ No jobseeker profile found for this user")

if __name__ == "__main__":
    test_jobseeker_profile()




