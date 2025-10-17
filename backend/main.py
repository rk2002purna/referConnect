#!/usr/bin/env python3
import os
import sys
import subprocess
import uvicorn
from app.main import create_app

def run_migrations():
    """Run Alembic migrations"""
    print("🔄 Running database migrations...")
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            capture_output=True,
            text=True
        )
        print("✅ Database migrations completed successfully")
        if result.stdout:
            print(f"Migration output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {e.stderr}")
        return False
    except Exception as e:
        print(f"❌ Migration error: {e}")
        return False

if __name__ == "__main__":
    # Get port from environment variable, default to 8000
    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0"
    
    print(f"🚀 Starting ReferConnect API on {host}:{port}")
    
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
    app = create_app()
    
    # Run the app
    uvicorn.run(app, host=host, port=port)
