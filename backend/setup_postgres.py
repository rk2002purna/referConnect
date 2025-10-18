#!/usr/bin/env python3
"""
Script to set up PostgreSQL database for ReferConnect
Run this script to create all necessary tables using Alembic migrations
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(f"Output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("🚀 Setting up PostgreSQL database for ReferConnect...")
    
    # Check if DATABASE_URL is set
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable not set!")
        print("Please set DATABASE_URL to your PostgreSQL connection string")
        print("Example: export DATABASE_URL='postgresql://user:password@host:port/database'")
        sys.exit(1)
    
    print(f"📊 Using database: {database_url}")
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Run Alembic upgrade to create all tables
    if not run_command("alembic upgrade head", "Creating database tables"):
        print("❌ Failed to create database tables")
        sys.exit(1)
    
    print("🎉 Database setup completed successfully!")
    print("📋 All tables have been created using Alembic migrations")
    print("🔗 Your backend should now be able to connect to PostgreSQL")

if __name__ == "__main__":
    main()
