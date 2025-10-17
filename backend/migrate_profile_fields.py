#!/usr/bin/env python3
"""
Migration script to add profile fields to existing database
"""
import asyncio
import sqlite3
from pathlib import Path

async def migrate_database():
    """Add new profile fields to the database"""
    db_path = Path("app.db")
    
    if not db_path.exists():
        print("Database not found. Please run the application first to create the database.")
        return
    
    # Connect to SQLite database
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # Check if new columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        new_columns = [
            ("first_name", "TEXT"),
            ("last_name", "TEXT"), 
            ("phone", "TEXT"),
            ("linkedin_url", "TEXT"),
            ("profile_picture", "TEXT"),
            ("bio", "TEXT"),
            ("location", "TEXT"),
            ("website", "TEXT")
        ]
        
        for column_name, column_type in new_columns:
            if column_name not in columns:
                print(f"Adding column: {column_name}")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")
            else:
                print(f"Column {column_name} already exists")
        
        # Check job_seekers table for resume fields
        cursor.execute("PRAGMA table_info(job_seekers)")
        jobseeker_columns = [column[1] for column in cursor.fetchall()]
        
        resume_columns = [
            ("resume_filename", "TEXT"),
            ("resume_path", "TEXT")
        ]
        
        for column_name, column_type in resume_columns:
            if column_name not in jobseeker_columns:
                print(f"Adding column to job_seekers: {column_name}")
                cursor.execute(f"ALTER TABLE job_seekers ADD COLUMN {column_name} {column_type}")
            else:
                print(f"Column {column_name} already exists in job_seekers")
        
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_database())

