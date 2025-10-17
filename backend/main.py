#!/usr/bin/env python3
import os
import sys
import subprocess
import uvicorn
from app.main import create_app

def run_migrations():
    """Run database table creation"""
    print("🔄 Creating database tables...")
    try:
        # Import and run the direct table creation
        from create_tables_direct import create_tables
        return create_tables()
    except Exception as e:
        print(f"❌ Table creation error: {e}")
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
