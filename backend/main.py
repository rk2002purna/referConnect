#!/usr/bin/env python3
import os
import uvicorn
from app.main import create_app

if __name__ == "__main__":
    # Get port from environment variable, default to 8000
    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0"
    
    print(f"Starting ReferConnect API on {host}:{port}")
    
    # Create the app
    app = create_app()
    
    # Run the app
    uvicorn.run(app, host=host, port=port)
