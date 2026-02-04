#!/usr/bin/env python3
import os
import sys
import subprocess
import uvicorn
from sqlalchemy import create_engine, text
from app.main import create_app
from app.core.config import settings

def run_migrations():
    """Run database table creation"""
    print("🔄 Creating database tables...")
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

        -- Referral Requests table
        CREATE TABLE IF NOT EXISTS referral_requests (
            id SERIAL PRIMARY KEY,
            job_id INTEGER REFERENCES jobs(id),
            employee_id INTEGER REFERENCES users(id),
            jobseeker_id INTEGER REFERENCES users(id),
            jobseeker_name VARCHAR(200) NOT NULL,
            jobseeker_email VARCHAR(255) NOT NULL,
            jobseeker_phone VARCHAR(20),
            linkedin_url VARCHAR(500),
            resume_filename VARCHAR(255),
            resume_file_path VARCHAR(500),
            resume_file_size INTEGER,
            resume_mime_type VARCHAR(100),
            personal_note TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            priority VARCHAR(20) DEFAULT 'normal',
            employee_response TEXT,
            employee_notes TEXT,
            responded_at TIMESTAMP NULL,
            request_metadata JSONB,
            viewed_by_employee BOOLEAN DEFAULT FALSE,
            viewed_at TIMESTAMP NULL,
            last_activity TIMESTAMP NULL,
            notification_sent BOOLEAN DEFAULT FALSE,
            notification_sent_at TIMESTAMP NULL,
            reminder_sent BOOLEAN DEFAULT FALSE,
            reminder_sent_at TIMESTAMP NULL,
            response_time_hours FLOAT,
            outcome VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Notifications table
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            recipient_id INTEGER NOT NULL,
            sender_id INTEGER,
            title VARCHAR(200) NOT NULL,
            message VARCHAR(1000) NOT NULL,
            notification_type VARCHAR(50) NOT NULL,
            priority VARCHAR(20) DEFAULT 'medium',
            channels VARCHAR(100) DEFAULT 'in_app',
            notification_metadata JSONB,
            is_read BOOLEAN DEFAULT FALSE,
            is_archived BOOLEAN DEFAULT FALSE,
            sent_at TIMESTAMP NULL,
            read_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Notification Preferences table
        CREATE TABLE IF NOT EXISTS notification_preferences (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL,
            email_notifications BOOLEAN DEFAULT TRUE,
            in_app_notifications BOOLEAN DEFAULT TRUE,
            sms_notifications BOOLEAN DEFAULT FALSE,
            push_notifications BOOLEAN DEFAULT TRUE,
            referral_notifications BOOLEAN DEFAULT TRUE,
            job_notifications BOOLEAN DEFAULT TRUE,
            system_notifications BOOLEAN DEFAULT TRUE,
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
        CREATE INDEX IF NOT EXISTS idx_referral_requests_job_id ON referral_requests(job_id);
        CREATE INDEX IF NOT EXISTS idx_referral_requests_employee_id ON referral_requests(employee_id);
        CREATE INDEX IF NOT EXISTS idx_referral_requests_jobseeker_id ON referral_requests(jobseeker_id);
        CREATE INDEX IF NOT EXISTS idx_referral_requests_jobseeker_email ON referral_requests(jobseeker_email);
        CREATE INDEX IF NOT EXISTS idx_referral_requests_status ON referral_requests(status);
        CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

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
app = create_app()

if __name__ == "__main__":
    # Get port from environment variable, default to 8000
    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0"
    
    print(f"🚀 Starting ReferConnect API on {host}:{port}")
    print(f"📊 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    
    # Check if DATABASE_URL is set
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable not set!")
        print("Skipping migrations and starting server...")
    else:
        print(f"📊 Using database: {database_url}")
        # Run migrations
        if not run_migrations():
            print("⚠️  Migrations failed, but continuing with server startup...")
    
    # Create the app
    
    
    # Run the app
    uvicorn.run(app, host=host, port=port, log_level="info")
