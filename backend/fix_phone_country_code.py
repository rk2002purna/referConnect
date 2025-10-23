#!/usr/bin/env python3
"""
Quick fix script to add phone_country_code column to users table
"""
import os
import psycopg2
from sqlalchemy import create_engine, text

def fix_phone_country_code():
    """Add phone_country_code column to users table if it doesn't exist"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        return False
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Check if column exists
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
            print("Adding phone_country_code column to users table...")
            alter_query = """
            ALTER TABLE users 
            ADD COLUMN phone_country_code VARCHAR(10) DEFAULT '+91'
            """
            
            conn.execute(text(alter_query))
            conn.commit()
            
            print("✅ Successfully added phone_country_code column to users table")
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = fix_phone_country_code()
    exit(0 if success else 1)


