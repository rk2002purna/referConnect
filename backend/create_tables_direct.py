#!/usr/bin/env python3
"""
Direct table creation script for PostgreSQL
This bypasses Alembic's async issues and creates tables directly
"""
import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def create_tables():
    """Create all necessary tables directly"""
    print("🔄 Creating database tables directly...")
    
    try:
        # Get database URL
        database_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
        print(f"📊 Using database: {database_url}")
        
        # Create engine
        engine = create_engine(database_url)
        
        # SQL to create all tables
        create_tables_sql = """
        -- Enable UUID extension
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

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
        CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
        CREATE INDEX IF NOT EXISTS idx_jobs_employee_id ON jobs(employee_id);
        CREATE INDEX IF NOT EXISTS idx_referrals_job_id ON referrals(job_id);
        CREATE INDEX IF NOT EXISTS idx_referrals_seeker_id ON referrals(seeker_id);
        CREATE INDEX IF NOT EXISTS idx_referrals_employee_id ON referrals(employee_id);

        -- Insert some sample companies
        INSERT INTO companies (name, domain, industry, size, is_verified) VALUES
        ('Google', 'google.com', 'Technology', '10000+', TRUE),
        ('Microsoft', 'microsoft.com', 'Technology', '10000+', TRUE),
        ('Apple', 'apple.com', 'Technology', '10000+', TRUE),
        ('Amazon', 'amazon.com', 'Technology', '10000+', TRUE),
        ('Meta', 'meta.com', 'Technology', '10000+', TRUE),
        ('Netflix', 'netflix.com', 'Entertainment', '5000-10000', TRUE),
        ('Uber', 'uber.com', 'Transportation', '1000-5000', TRUE),
        ('Airbnb', 'airbnb.com', 'Travel', '1000-5000', TRUE),
        ('Foxroids', 'foxroids.com', 'Technology', '1-100', TRUE)
        ON CONFLICT (domain) DO NOTHING;

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
        """
        
        # Execute the SQL
        with engine.connect() as conn:
            conn.execute(text(create_tables_sql))
            conn.commit()
        
        print("✅ Database tables created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

if __name__ == "__main__":
    success = create_tables()
    sys.exit(0 if success else 1)
