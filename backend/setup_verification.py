#!/usr/bin/env python3
"""
Setup script for verification system
This script will:
1. Run database migrations
2. Seed verified companies data
3. Start the backend server
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("🚀 Setting up ReferConnect Verification System")
    print("=" * 50)
    
    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Step 1: Run database migration
    if not run_command("alembic upgrade head", "Running database migrations"):
        print("❌ Migration failed. Please check your database connection.")
        return False
    
    # Step 2: Seed verified companies data
    if not run_command("python seed_verification_data.py", "Seeding verified companies data"):
        print("❌ Seeding failed. Please check the script.")
        return False
    
    # Step 3: Start the backend server
    print("\n🚀 Starting backend server...")
    print("Backend will be available at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        subprocess.run("uvicorn app.main:app --reload --host 0.0.0.0 --port 8000", shell=True)
    except KeyboardInterrupt:
        print("\n👋 Backend server stopped.")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)







