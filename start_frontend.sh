#!/bin/bash

# Start Frontend Server
# This script starts the React frontend development server

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

# Start the frontend server
echo "🚀 Starting ReferConnect Frontend Server..."
echo "🌐 Frontend will be available at http://localhost:3000"
echo ""
npm start


