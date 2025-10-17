#!/usr/bin/env python3
"""
Startup script that runs database migrations before starting the server
"""
import os
import sys
import subprocess
import uvicorn
from pathlib import Path

def run_migrations():
    """Run Alembic migrations"""
    print("🔄 Running database migrations...")
    try:
        # Change to the backend directory
        backend_dir = Path(__file__).parent
        os.chdir(backend_dir)
        
        # Run alembic upgrade
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

def main():
    print("🚀 Starting ReferConnect API with database migrations...")
    
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
    
    # Start the server
    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0"
    
    print(f"🌐 Starting server on {host}:{port}")
    
    # Import and create the app
    from app.main import create_app
    app = create_app()
    
    # Run the server
    uvicorn.run(app, host=host, port=port)

if __name__ == "__main__":
    main()
