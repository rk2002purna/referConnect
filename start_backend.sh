#!/bin/bash

# Start Backend Server
# This script starts the FastAPI backend server

cd "$(dirname "$0")/backend"

echo "🚀 Starting ReferConnect Backend Server..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found."
    echo "Creating .env file with default settings..."
    cat > .env << 'EOF'
ENV=dev
DEBUG=true
SECRET_KEY=dev-secret-key-change-in-production-12345
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_MINUTES=20160
JWT_ALGORITHM=HS256
ALGORITHM=HS256
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/referconnect
CORS_ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
ALLOWED_ORIGINS=*
EMAIL_FROM=noreply@referconnect.app
FROM_EMAIL=noreply@referconnect.com
GDPR_ENABLED=true
CCPA_ENABLED=true
EOF
    echo "✅ Created .env file. Please update DATABASE_URL if needed."
    echo ""
fi

# Load environment variables
set -a
source .env
set +a

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Using system Python."
    echo "   For better isolation, create venv: python3 -m venv venv"
    echo ""
fi

# Check if required packages are installed
if ! python3 -c "import fastapi, uvicorn" 2>/dev/null; then
    echo "❌ Required Python packages not found."
    echo "   Installing dependencies..."
    if [ -d "venv" ]; then
        pip install -q -r requirements.txt
    else
        pip3 install --user -q -r requirements.txt || pip install -q -r requirements.txt
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Start the server
echo "📊 API will be available at http://localhost:8000"
echo "📚 API docs will be available at http://localhost:8000/docs"
echo "🏥 Health check: http://localhost:8000/health"
echo ""
echo "Starting server..."
echo ""

python3 main.py

