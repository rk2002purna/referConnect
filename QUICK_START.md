# Quick Start Guide

## Prerequisites Check

Make sure you have:
- ✅ Docker Desktop installed and running
- ✅ Python 3.8+ installed
- ✅ Node.js 16+ and npm installed

## Step 1: Create Environment Files

### Backend `.env` file

Create `backend/.env`:

```env
ENV=dev
DEBUG=true
SECRET_KEY=dev-secret-key-change-in-production-12345
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/referconnect
CORS_ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
ALLOWED_ORIGINS=*
```

### Frontend `.env` file

Create `.env` in the root directory:

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_DEBUG=true
```

## Step 2: Start Database Services

```bash
cd backend
docker-compose up -d postgres pgadmin
```

Wait 10-15 seconds for PostgreSQL to start.

## Step 3: Setup Database

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 setup_postgres_tables.py
```

## Step 4: Start Backend

```bash
cd backend
source venv/bin/activate
python3 main.py
```

Backend will run at: http://localhost:8000
API Docs: http://localhost:8000/docs

## Step 5: Start Frontend (New Terminal)

```bash
npm install  # First time only
npm start
```

Frontend will run at: http://localhost:3000

## Access pgAdmin

- URL: http://localhost:8080
- Email: `admin@referconnect.com`
- Password: `admin123`

### Connect to Database in pgAdmin:

1. Right-click "Servers" → "Register" → "Server"
2. General tab:
   - Name: `ReferConnect Local`
3. Connection tab:
   - Host: `postgres` (or `localhost` if connecting from host)
   - Port: `5432`
   - Database: `referconnect`
   - Username: `postgres`
   - Password: `postgres`
4. Click "Save"

## Troubleshooting

### Port Already in Use
- Change ports in `docker-compose.yml` if 5432, 8080, 8000, or 3000 are in use

### Database Connection Error
- Make sure Docker containers are running: `docker ps`
- Check container logs: `docker logs <container-name>`

### Python Dependencies
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

### Node Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## What's Next?

1. ✅ Register a new user account
2. ✅ Complete your profile
3. ✅ Test the verification flow
4. ✅ Explore the API documentation at http://localhost:8000/docs

For detailed setup instructions, see [LOCAL_SETUP.md](LOCAL_SETUP.md)


