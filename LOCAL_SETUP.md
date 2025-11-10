# Local Development Setup Guide

This guide will help you set up and run the ReferConnect application locally with PostgreSQL and pgAdmin.

## Prerequisites

- **Docker** and **Docker Compose** installed and running
- **Python 3.8+** installed
- **Node.js 16+** and **npm** installed
- **PostgreSQL client** (optional, for direct database access)

## Step 1: Create Environment Files

### Backend Environment File

Create a file `backend/.env` with the following content:

```env
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

# Database - PostgreSQL (using docker-compose)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/referconnect

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
```

### Frontend Environment File

Create a file `.env` in the root directory with the following content:

```env
# API Configuration
# For local development:
REACT_APP_API_URL=http://localhost:8000/api/v1

# Optional: Enable debug mode
REACT_APP_DEBUG=true
```

## Step 2: Start PostgreSQL and pgAdmin

Navigate to the backend directory and start the database services:

```bash
cd backend
docker-compose up -d postgres pgadmin
```

Or if you're using newer Docker versions:

```bash
cd backend
docker compose up -d postgres pgAdmin
```

Wait for PostgreSQL to be ready (about 10-15 seconds).

## Step 3: Setup Database

### Option A: Using the Setup Script (Recommended)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 setup_postgres_tables.py
```

### Option B: Using pgAdmin (Manual)

1. Open pgAdmin in your browser: http://localhost:8080
2. Login with:
   - Email: `admin@referconnect.com`
   - Password: `admin123`
3. Add a new server:
   - Name: `ReferConnect Local`
   - Host: `postgres` (or `localhost`)
   - Port: `5432`
   - Database: `referconnect`
   - Username: `postgres`
   - Password: `postgres`
4. Right-click on the `referconnect` database and select "Query Tool"
5. Copy and paste the SQL from `backend/create_tables.sql` and execute it
6. Copy and paste the SQL from `seed_companies.sql` (in root directory) and execute it

## Step 4: Start Backend Server

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python3 main.py
```

The backend API will be available at:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Step 5: Start Frontend Server

Open a new terminal window and run:

```bash
npm install  # Only needed first time
npm start
```

The frontend will be available at:
- Frontend: http://localhost:3000

## Quick Start Scripts

We've provided convenience scripts to make setup easier:

### 1. Complete Setup (First Time)

```bash
./setup_local.sh
```

This script will:
- Check prerequisites
- Start PostgreSQL and pgAdmin
- Set up Python virtual environment
- Install dependencies
- Create database tables
- Seed initial data

### 2. Start Backend

```bash
./start_backend.sh
```

### 3. Start Frontend

```bash
./start_frontend.sh
```

## Accessing pgAdmin

1. Open http://localhost:8080 in your browser
2. Login with:
   - Email: `admin@referconnect.com`
   - Password: `admin123`
3. Add server connection:
   - Host: `postgres` (if connecting from Docker network) or `host.docker.internal` (if connecting from host)
   - Port: `5432`
   - Database: `referconnect`
   - Username: `postgres`
   - Password: `postgres`

## Database Tables

The following tables will be created:

### Core Tables
- `users` - User accounts
- `companies` - Company information
- `job_seekers` - Job seeker profiles
- `employees` - Employee profiles
- `jobs` - Job postings
- `referrals` - Referral records

### Verification Tables
- `verified_companies` - Verified companies for employee verification
- `employee_verifications` - Employee verification status
- `otp_verifications` - OTP codes for email verification
- `id_card_verifications` - ID card verification requests

## Troubleshooting

### PostgreSQL Connection Issues

If you can't connect to PostgreSQL:

1. Check if the container is running:
   ```bash
   docker ps
   ```

2. Check container logs:
   ```bash
   docker logs <container-name>
   ```

3. Restart the containers:
   ```bash
   cd backend
   docker-compose down
   docker-compose up -d postgres pgadmin
   ```

### Port Already in Use

If port 5432, 8080, 8000, or 3000 is already in use:

1. Stop the conflicting service
2. Or change the port in `docker-compose.yml` and update `DATABASE_URL` in `backend/.env`

### Database Migration Errors

If you encounter migration errors:

1. Drop and recreate the database:
   ```bash
   docker exec -it <postgres-container-name> psql -U postgres -c "DROP DATABASE referconnect;"
   docker exec -it <postgres-container-name> psql -U postgres -c "CREATE DATABASE referconnect;"
   ```

2. Run the setup script again:
   ```bash
   cd backend
   python3 setup_postgres_tables.py
   ```

### Python Dependencies Issues

If you have issues with Python dependencies:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Node.js Dependencies Issues

If you have issues with Node.js dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Testing the Application

1. **Backend Health Check**: Visit http://localhost:8000/health
2. **API Documentation**: Visit http://localhost:8000/docs
3. **Frontend**: Visit http://localhost:3000
4. **pgAdmin**: Visit http://localhost:8080

## Next Steps

- Register a new user account
- Complete your profile
- Test the verification flow
- Explore the API documentation

## Additional Resources

- [Backend API Documentation](backend/API_DOCUMENTATION.md)
- [Database Setup Guide](DATABASE_SETUP.md)
- [Verification System README](backend/VERIFICATION_SYSTEM_README.md)


