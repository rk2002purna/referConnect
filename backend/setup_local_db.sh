#!/bin/bash

# Setup script for local PostgreSQL database
# This script helps you set up the .env file and run database migrations

set -e

echo "🚀 ReferConnect Local Database Setup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
        USE_EXISTING=true
    else
        USE_EXISTING=false
    fi
else
    USE_EXISTING=false
fi

# Get database credentials
if [ "$USE_EXISTING" = false ]; then
    echo ""
    echo "Please provide your PostgreSQL database credentials:"
    echo "(Press Enter to use defaults)"
    echo ""
    
    read -p "Database Host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "Database Port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    
    read -p "Database Name [referconnect]: " DB_NAME
    DB_NAME=${DB_NAME:-referconnect}
    
    read -p "Database User [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -sp "Database Password: " DB_PASSWORD
    echo ""
    DB_PASSWORD=${DB_PASSWORD:-postgres}
    
    # Create .env file
    cat > .env << EOF
# Local Development Environment Variables

# Environment
ENV=dev
DEBUG=true

# Security
SECRET_KEY=dev-secret-key-change-in-production-12345
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_MINUTES=20160
JWT_ALGORITHM=HS256
ALGORITHM=HS256

# Database - PostgreSQL
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# CORS - Allow local frontend
CORS_ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
ALLOWED_ORIGINS=*

# Email Configuration (optional for local dev)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
GMAIL_EMAIL=
GMAIL_APP_PASSWORD=
OUTLOOK_EMAIL=
OUTLOOK_PASSWORD=
YAHOO_EMAIL=
YAHOO_APP_PASSWORD=
EMAIL_FROM=noreply@referconnect.app
FROM_EMAIL=noreply@referconnect.com

# Compliance
GDPR_ENABLED=true
CCPA_ENABLED=true

# AWS S3 Configuration (optional for local dev)
AWS_S3_BUCKET_NAME=referconnect-resumes
AWS_S3_REGION=eu-north-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
EOF
    
    echo -e "${GREEN}✅ Created .env file${NC}"
else
    echo -e "${GREEN}✅ Using existing .env file${NC}"
    # Load existing .env to get DATABASE_URL
    export $(cat .env | grep -v '^#' | xargs)
fi

# Load .env file
export $(cat .env | grep -v '^#' | xargs)

echo ""
echo "🔍 Testing database connection..."
echo ""

# Test connection
python3 test_db_connection.py

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database connection failed${NC}"
    echo ""
    echo "Please:"
    echo "1. Make sure PostgreSQL is running"
    echo "2. Verify the database '${DB_NAME}' exists"
    echo "3. Check your credentials in .env file"
    echo "4. Try connecting manually: psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}"
    exit 1
fi

echo ""
echo "📦 Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "${GREEN}✅ Virtual environment already exists${NC}"
fi

source venv/bin/activate

echo ""
echo "📥 Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo ""
echo "🗄️  Creating database tables..."
python3 setup_postgres_tables.py

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start the backend server:"
    echo "   source venv/bin/activate && python3 main.py"
    echo ""
    echo "2. The API will be available at http://localhost:8000"
    echo "3. API docs will be available at http://localhost:8000/docs"
else
    echo ""
    echo -e "${RED}❌ Database setup failed${NC}"
    exit 1
fi


