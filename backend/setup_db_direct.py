#!/usr/bin/env python3
"""
Direct database setup script
This script creates the verification tables directly without migrations
"""

import sqlite3
import os
import sys

def setup_database():
    """Create verification tables directly in SQLite"""
    
    # Database path
    db_path = "referconnect.db"
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🔧 Setting up verification tables...")
    
    # Create verified_companies table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS verified_companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            domain VARCHAR(255) NOT NULL UNIQUE,
            industry VARCHAR(100),
            size VARCHAR(50),
            verified BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create employee_verifications table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employee_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            company_id INTEGER NOT NULL,
            verification_method VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL,
            personal_email VARCHAR(255),
            company_email VARCHAR(255),
            verified_at DATETIME,
            expires_at DATETIME,
            rejection_reason VARCHAR(500),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (company_id) REFERENCES verified_companies(id)
        )
    """)
    
    # Create otp_verifications table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS otp_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            company_id INTEGER NOT NULL,
            company_email VARCHAR(255) NOT NULL,
            otp_code VARCHAR(6) NOT NULL,
            expires_at DATETIME NOT NULL,
            verified BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (company_id) REFERENCES verified_companies(id)
        )
    """)
    
    # Create id_card_verifications table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS id_card_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            company_id INTEGER NOT NULL,
            selfie_url VARCHAR(500),
            id_card_url VARCHAR(500),
            status VARCHAR(20) DEFAULT 'pending',
            admin_notes TEXT,
            rejection_reason VARCHAR(500),
            reviewed_by INTEGER,
            reviewed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (company_id) REFERENCES verified_companies(id),
            FOREIGN KEY (reviewed_by) REFERENCES users(id)
        )
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_verified_companies_domain ON verified_companies(domain)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_verified_companies_name ON verified_companies(name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_employee_verifications_user_id ON employee_verifications(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_employee_verifications_company_id ON employee_verifications(company_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_employee_verifications_status ON employee_verifications(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_otp_verifications_user_id ON otp_verifications(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_otp_verifications_company_id ON otp_verifications(company_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_id_card_verifications_user_id ON id_card_verifications(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_id_card_verifications_company_id ON id_card_verifications(company_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_id_card_verifications_status ON id_card_verifications(status)")
    
    print("✅ Database tables created successfully!")
    
    # Insert sample companies
    companies = [
        ("Google", "google.com", "Technology", "10,000+", 1),
        ("Microsoft", "microsoft.com", "Technology", "10,000+", 1),
        ("Apple", "apple.com", "Technology", "10,000+", 1),
        ("Amazon", "amazon.com", "E-commerce", "10,000+", 1),
        ("Meta", "meta.com", "Technology", "10,000+", 1),
        ("Netflix", "netflix.com", "Entertainment", "1,000-10,000", 1),
        ("Tesla", "tesla.com", "Automotive", "1,000-10,000", 1),
        ("Uber", "uber.com", "Transportation", "1,000-10,000", 1),
        ("Airbnb", "airbnb.com", "Hospitality", "1,000-10,000", 1),
        ("Stripe", "stripe.com", "Fintech", "100-1,000", 1),
        ("Wipro", "wipro.com", "IT Services", "10,000+", 1),
        ("Infosys", "infosys.com", "IT Services", "10,000+", 1),
        ("TCS", "tcs.com", "IT Services", "10,000+", 1),
        ("Accenture", "accenture.com", "Consulting", "10,000+", 1),
        ("IBM", "ibm.com", "Technology", "10,000+", 1),
        ("Oracle", "oracle.com", "Technology", "10,000+", 1),
        ("Salesforce", "salesforce.com", "Technology", "10,000+", 1),
        ("Adobe", "adobe.com", "Technology", "1,000-10,000", 1),
        ("Spotify", "spotify.com", "Entertainment", "1,000-10,000", 1),
        ("Zoom", "zoom.us", "Technology", "1,000-10,000", 1),
    ]
    
    cursor.executemany("""
        INSERT OR IGNORE INTO verified_companies (name, domain, industry, size, verified)
        VALUES (?, ?, ?, ?, ?)
    """, companies)
    
    print(f"✅ Inserted {len(companies)} companies!")
    
    # Commit and close
    conn.commit()
    conn.close()
    
    print("🎉 Database setup completed successfully!")
    return True

if __name__ == "__main__":
    try:
        setup_database()
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        sys.exit(1)







