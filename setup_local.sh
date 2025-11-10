#!/bin/bash

# ReferConnect Local Development Setup Script
# This script sets up and starts both backend and frontend services

set -e  # Exit on error

echo "🚀 ReferConnect Local Development Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed and running
echo "📦 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is installed and running${NC}"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not available. Please install docker-compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ docker-compose is available${NC}"

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Start PostgreSQL and pgAdmin using docker-compose
echo ""
echo "🐘 Starting PostgreSQL and pgAdmin..."
if docker compose version &> /dev/null; then
    docker compose up -d postgres pgadmin
else
    docker-compose up -d postgres pgadmin
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Find the PostgreSQL container name
POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "postgres|referconnect.*postgres" | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${YELLOW}⚠️  Could not find PostgreSQL container name automatically${NC}"
    echo "Please check if PostgreSQL is running: docker ps"
else
    echo -e "${GREEN}✅ Found PostgreSQL container: $POSTGRES_CONTAINER${NC}"
    
    # Check if PostgreSQL is ready
    for i in {1..30}; do
        if docker exec "$POSTGRES_CONTAINER" pg_isready -U postgres &> /dev/null; then
            echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ PostgreSQL failed to start${NC}"
            exit 1
        fi
        sleep 1
        echo -n "."
    done
fi

# Check if Python is installed
echo ""
echo "🐍 Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.8 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python is installed${NC}"

# Check if virtual environment exists, create if not
echo ""
echo "📦 Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo ""
echo "📥 Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env file not found.${NC}"
    echo -e "${YELLOW}Please create backend/.env file with the following content:${NC}"
    echo ""
    echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/referconnect"
    echo "SECRET_KEY=dev-secret-key-change-in-production-12345"
    echo "DEBUG=true"
    echo ""
    echo "See LOCAL_SETUP.md for complete .env file template."
    echo -e "${RED}❌ Please create backend/.env file and run this script again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend .env file exists${NC}"

# Setup database tables
echo ""
echo "🗄️  Setting up database tables..."
python3 setup_postgres_tables.py

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to setup database tables${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database setup completed${NC}"

# Navigate back to root
cd ..

# Check if Node.js is installed
echo ""
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js is installed ($(node --version))${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm is installed ($(npm --version))${NC}"

# Navigate back to root
cd ..

# Check if frontend .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env file not found.${NC}"
    echo -e "${YELLOW}Please create .env file in root directory with the following content:${NC}"
    echo ""
    echo "REACT_APP_API_URL=http://localhost:8000/api/v1"
    echo "REACT_APP_DEBUG=true"
    echo ""
    echo "See LOCAL_SETUP.md for complete .env file template."
    echo -e "${RED}❌ Please create .env file and run this script again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend .env file exists${NC}"

# Install frontend dependencies
echo ""
echo "📥 Installing frontend dependencies..."
npm install

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Start the backend server:"
echo "      cd backend && source venv/bin/activate && python3 main.py"
echo ""
echo "   2. Start the frontend server (in a new terminal):"
echo "      npm start"
echo ""
echo "   3. Access pgAdmin at http://localhost:8080"
echo "      - Email: admin@referconnect.com"
echo "      - Password: admin123"
echo ""
echo "   4. Connect to PostgreSQL in pgAdmin:"
echo "      - Host: postgres (or localhost)"
echo "      - Port: 5432"
echo "      - Database: referconnect"
echo "      - Username: postgres"
echo "      - Password: postgres"
echo ""

