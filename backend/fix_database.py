#!/usr/bin/env python3
"""
Database fix script to add missing phone_country_code column
Run this script to fix the database schema issue
"""
import os
import sys
from sqlalchemy import create_engine, text

def fix_database():
    """Add phone_country_code column to users table"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        print("Please set DATABASE_URL in your environment")
        return False
    
    try:
        print("🔗 Connecting to database...")
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Check if column exists
            print("🔍 Checking if phone_country_code column exists...")
            check_query = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'phone_country_code'
            """
            
            result = conn.execute(text(check_query))
            column_exists = result.fetchone() is not None
            
            if column_exists:
                print("✅ phone_country_code column already exists")
                return True
            
            # Add the column
            print("➕ Adding phone_country_code column to users table...")
            alter_query = """
            ALTER TABLE users 
            ADD COLUMN phone_country_code VARCHAR(10) DEFAULT '+91'
            """
            
            conn.execute(text(alter_query))
            conn.commit()
            
            print("✅ Successfully added phone_country_code column to users table")
            print("🎉 Database fix completed! Your backend should now work properly.")
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Manual fix: Run this SQL command on your database:")
        print("ALTER TABLE users ADD COLUMN phone_country_code VARCHAR(10) DEFAULT '+91';")
        return False

if __name__ == "__main__":
    print("🚀 Starting database fix...")
    success = fix_database()
    sys.exit(0 if success else 1)


