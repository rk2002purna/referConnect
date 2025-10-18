#!/usr/bin/env python3
"""
Render.com startup script
This ensures the app starts correctly on Render's free tier
"""
import os
import sys
import uvicorn
from app.main import create_app

if __name__ == "__main__":
    # Get port from Render environment variable
    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0"
    
    print(f"🚀 Starting ReferConnect API on {host}:{port}")
    print(f"📊 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    
    # Create the app
    app = create_app()
    
    # Run the app
    uvicorn.run(app, host=host, port=port, log_level="info")
