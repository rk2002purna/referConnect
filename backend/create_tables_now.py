#!/usr/bin/env python3
"""
Create all database tables for ReferConnect
Run this script to create all necessary tables in your database
"""

import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from sqlalchemy import create_engine, text
    from app.core.config import settings
except ImportError as e:
    print(f"❌ Error importing required modules: {e}")
    print("Please install dependencies: pip install -r requirements.txt")
    sys.exit(1)

def create_all_tables():
    """Create all necessary tables including verification tables"""
    print("🔄 Creating database tables...")
    print("")
    
    try:
        # Get database URL from environment or config
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            # Try to load from .env file
            try:
                with open(".env", "r") as f:
                    for line in f:
                        if line.startswith("DATABASE_URL"):
                            database_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                            break
            except:
                pass
        
        if not database_url:
            database_url = settings.DATABASE_URL
        
        print(f"📊 Database URL: {database_url.split('@')[1] if '@' in database_url else database_url}")
        print("")
        
        # Create engine
        engine = create_engine(database_url)
        
        print("🔨 Creating tables...")
        print("")
        
        # SQL to create all tables
        create_tables_sql = """
        -- Enable UUID extension (if not exists)
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            hashed_password VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK (role IN ('employee', 'jobseeker', 'admin')),
            is_email_verified BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            mfa_enabled BOOLEAN DEFAULT FALSE,
            email_domain VARCHAR(255),
            phone VARCHAR(20),
            linkedin_url VARCHAR(500),
            profile_picture VARCHAR(500),
            bio TEXT,
            location VARCHAR(255),
            website VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL
        );

        -- Companies table
        CREATE TABLE IF NOT EXISTS companies (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            domain VARCHAR(255) UNIQUE NOT NULL,
            industry VARCHAR(100),
            size VARCHAR(50),
            description TEXT,
            website VARCHAR(255),
            logo_url VARCHAR(500),
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Job Seekers table
        CREATE TABLE IF NOT EXISTS job_seekers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            skills TEXT,
            years_experience INTEGER,
            current_company VARCHAR(255),
            privacy_excluded_companies TEXT,
            trust_score DECIMAL(3,2) DEFAULT 0.00,
            resume_filename VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Employees table
        CREATE TABLE IF NOT EXISTS employees (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            company_id INTEGER REFERENCES companies(id),
            title VARCHAR(255),
            badges TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Jobs table
        CREATE TABLE IF NOT EXISTS jobs (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            location VARCHAR(255),
            employment_type VARCHAR(50),
            skills TEXT,
            min_experience INTEGER,
            company_id INTEGER REFERENCES companies(id),
            employee_id INTEGER REFERENCES employees(id),
            is_active BOOLEAN DEFAULT TRUE,
            job_link VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Referrals table
        CREATE TABLE IF NOT EXISTS referrals (
            id SERIAL PRIMARY KEY,
            job_id INTEGER REFERENCES jobs(id),
            seeker_id INTEGER REFERENCES job_seekers(id),
            employee_id INTEGER REFERENCES employees(id),
            status VARCHAR(50) DEFAULT 'pending',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Verified Companies table (for employee verification)
        CREATE TABLE IF NOT EXISTS verified_companies (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            domain VARCHAR(255) NOT NULL UNIQUE,
            industry VARCHAR(100),
            size VARCHAR(50),
            verified BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Employee Verifications table
        CREATE TABLE IF NOT EXISTS employee_verifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_id INTEGER NOT NULL REFERENCES verified_companies(id),
            verification_method VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL,
            personal_email VARCHAR(255),
            company_email VARCHAR(255),
            verified_at TIMESTAMP,
            expires_at TIMESTAMP,
            rejection_reason VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- OTP Verifications table
        CREATE TABLE IF NOT EXISTS otp_verifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_id INTEGER NOT NULL REFERENCES verified_companies(id),
            company_email VARCHAR(255) NOT NULL,
            otp_code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- ID Card Verifications table
        CREATE TABLE IF NOT EXISTS id_card_verifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_id INTEGER NOT NULL REFERENCES verified_companies(id),
            selfie_url VARCHAR(500),
            id_card_url VARCHAR(500),
            status VARCHAR(20) DEFAULT 'pending',
            admin_notes TEXT,
            rejection_reason VARCHAR(500),
            reviewed_by INTEGER REFERENCES users(id),
            reviewed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        # Execute the SQL to create tables
        with engine.connect() as conn:
            conn.execute(text(create_tables_sql))
            conn.commit()
        
        print("✅ Tables created successfully!")
        print("")
        
        # Create indexes
        print("🔨 Creating indexes...")
        indexes_sql = """
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
        CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
        CREATE INDEX IF NOT EXISTS idx_jobs_employee_id ON jobs(employee_id);
        CREATE INDEX IF NOT EXISTS idx_referrals_job_id ON referrals(job_id);
        CREATE INDEX IF NOT EXISTS idx_referrals_seeker_id ON referrals(seeker_id);
        CREATE INDEX IF NOT EXISTS idx_referrals_employee_id ON referrals(employee_id);
        CREATE INDEX IF NOT EXISTS idx_verified_companies_domain ON verified_companies(domain);
        CREATE INDEX IF NOT EXISTS idx_verified_companies_name ON verified_companies(name);
        CREATE INDEX IF NOT EXISTS idx_employee_verifications_user_id ON employee_verifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_employee_verifications_company_id ON employee_verifications(company_id);
        CREATE INDEX IF NOT EXISTS idx_employee_verifications_status ON employee_verifications(status);
        CREATE INDEX IF NOT EXISTS idx_otp_verifications_user_id ON otp_verifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_otp_verifications_company_id ON otp_verifications(company_id);
        CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);
        CREATE INDEX IF NOT EXISTS idx_id_card_verifications_user_id ON id_card_verifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_id_card_verifications_company_id ON id_card_verifications(company_id);
        CREATE INDEX IF NOT EXISTS idx_id_card_verifications_status ON id_card_verifications(status);
        """
        
        with engine.connect() as conn:
            conn.execute(text(indexes_sql))
            conn.commit()
        
        print("✅ Indexes created successfully!")
        print("")
        
        # Create triggers
        print("🔨 Creating triggers...")
        triggers_sql = """
        -- Create a function to update the updated_at timestamp
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create triggers to automatically update updated_at
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
        CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_job_seekers_updated_at ON job_seekers;
        CREATE TRIGGER update_job_seekers_updated_at BEFORE UPDATE ON job_seekers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
        CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
        CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
        CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_verified_companies_updated_at ON verified_companies;
        CREATE TRIGGER update_verified_companies_updated_at BEFORE UPDATE ON verified_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_employee_verifications_updated_at ON employee_verifications;
        CREATE TRIGGER update_employee_verifications_updated_at BEFORE UPDATE ON employee_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_otp_verifications_updated_at ON otp_verifications;
        CREATE TRIGGER update_otp_verifications_updated_at BEFORE UPDATE ON otp_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_id_card_verifications_updated_at ON id_card_verifications;
        CREATE TRIGGER update_id_card_verifications_updated_at BEFORE UPDATE ON id_card_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
        
        with engine.connect() as conn:
            conn.execute(text(triggers_sql))
            conn.commit()
        
        print("✅ Triggers created successfully!")
        print("")
        
        # Seed verified companies
        print("🌱 Seeding verified companies...")
        companies_data = [
            ("Google", "google.com", "Technology", "10,000+", True),
            ("Microsoft", "microsoft.com", "Technology", "10,000+", True),
            ("Apple", "apple.com", "Technology", "10,000+", True),
            ("Amazon", "amazon.com", "E-commerce", "10,000+", True),
            ("Meta", "meta.com", "Technology", "10,000+", True),
            ("Netflix", "netflix.com", "Entertainment", "1,000-10,000", True),
            ("Tesla", "tesla.com", "Automotive", "1,000-10,000", True),
            ("Uber", "uber.com", "Transportation", "1,000-10,000", True),
            ("Airbnb", "airbnb.com", "Hospitality", "1,000-10,000", True),
            ("Stripe", "stripe.com", "Fintech", "100-1,000", True),
            ("Wipro", "wipro.com", "IT Services", "10,000+", True),
            ("Infosys", "infosys.com", "IT Services", "10,000+", True),
            ("TCS", "tcs.com", "IT Services", "10,000+", True),
            ("Accenture", "accenture.com", "Consulting", "10,000+", True),
            ("IBM", "ibm.com", "Technology", "10,000+", True),
            ("Oracle", "oracle.com", "Technology", "10,000+", True),
            ("Salesforce", "salesforce.com", "Technology", "10,000+", True),
            ("Adobe", "adobe.com", "Technology", "1,000-10,000", True),
            ("Spotify", "spotify.com", "Entertainment", "1,000-10,000", True),
            ("Zoom", "zoom.us", "Technology", "1,000-10,000", True),
            ("NRLord", "nrlord.com", "Technology", "1-100", True),
        ]
        
        seed_sql = text("""
            INSERT INTO verified_companies (name, domain, industry, size, verified)
            VALUES (:name, :domain, :industry, :size, :verified)
            ON CONFLICT (domain) DO NOTHING
        """)
        
        seed_companies_sql = text("""
            INSERT INTO companies (name, domain, industry, size, is_verified)
            VALUES (:name, :domain, :industry, :size, :is_verified)
            ON CONFLICT (domain) DO NOTHING
        """)
        
        with engine.connect() as conn:
            for company in companies_data:
                conn.execute(seed_sql, {
                    "name": company[0],
                    "domain": company[1],
                    "industry": company[2],
                    "size": company[3],
                    "verified": company[4]
                })
                conn.execute(seed_companies_sql, {
                    "name": company[0],
                    "domain": company[1],
                    "industry": company[2],
                    "size": company[3],
                    "is_verified": company[4]
                })
            conn.commit()
        
        print(f"✅ Seeded {len(companies_data)} companies!")
        print("")
        print("🎉 Database setup completed successfully!")
        print("")
        print("📋 Created tables:")
        print("   - users")
        print("   - companies")
        print("   - verified_companies")
        print("   - job_seekers")
        print("   - employees")
        print("   - jobs")
        print("   - referrals")
        print("   - employee_verifications")
        print("   - otp_verifications")
        print("   - id_card_verifications")
        print("")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("ReferConnect Database Setup")
    print("=" * 60)
    print("")
    
    success = create_all_tables()
    
    if success:
        print("✅ Setup completed successfully!")
        sys.exit(0)
    else:
        print("❌ Setup failed!")
        sys.exit(1)


