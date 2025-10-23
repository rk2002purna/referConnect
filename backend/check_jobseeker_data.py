import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

engine = create_engine(DATABASE_URL)

def check_jobseeker_data():
    print("Checking jobseeker data in database...")
    with engine.connect() as connection:
        # Check if job_seekers table exists and has data
        result = connection.execute(text("""
            SELECT 
                js.user_id,
                u.email,
                u.first_name,
                u.last_name,
                js.skills,
                js.years_experience,
                js.current_company,
                js.current_job_title,
                js.education,
                js.certifications,
                js.preferred_job_types,
                js.salary_expectation_min,
                js.salary_expectation_max,
                js.salary_currency,
                js.work_authorization,
                js.languages,
                js.portfolio_url,
                js.linkedin_url,
                js.github_url
            FROM job_seekers js
            JOIN users u ON js.user_id = u.id
            ORDER BY js.created_at DESC
        """))
        
        jobseekers = result.fetchall()
        
        if not jobseekers:
            print("❌ No jobseeker profiles found in database")
        else:
            print(f"✅ Found {len(jobseekers)} jobseeker profile(s):")
            for i, jobseeker in enumerate(jobseekers, 1):
                print(f"\n--- Jobseeker {i} ---")
                print(f"User ID: {jobseeker.user_id}")
                print(f"Email: {jobseeker.email}")
                print(f"Name: {jobseeker.first_name} {jobseeker.last_name}")
                print(f"Skills: {jobseeker.skills}")
                print(f"Years Experience: {jobseeker.years_experience}")
                print(f"Current Company: {jobseeker.current_company}")
                print(f"Current Job Title: {jobseeker.current_job_title}")
                print(f"Education: {jobseeker.education}")
                print(f"Certifications: {jobseeker.certifications}")
                print(f"Preferred Job Types: {jobseeker.preferred_job_types}")
                print(f"Salary: {jobseeker.salary_currency} {jobseeker.salary_expectation_min}-{jobseeker.salary_expectation_max}")
                print(f"Work Authorization: {jobseeker.work_authorization}")
                print(f"Languages: {jobseeker.languages}")
                print(f"Portfolio: {jobseeker.portfolio_url}")
                print(f"LinkedIn: {jobseeker.linkedin_url}")
                print(f"GitHub: {jobseeker.github_url}")

if __name__ == "__main__":
    check_jobseeker_data()




