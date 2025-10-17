#!/bin/bash

# Get port from environment variable, default to 8000
PORT=${PORT:-8000}

echo "Starting ReferConnect API on port $PORT"

# Start the application
uvicorn app.main:create_app --factory --host 0.0.0.0 --port $PORT
