# Starting the Backend Service

## Prerequisites Fix

**Important:** You're seeing an `xcrun` error, which means macOS Command Line Tools need to be installed/updated.

### Fix xcrun Error (Required)

Run this command to install/update Command Line Tools:

```bash
xcode-select --install
```

Or if that doesn't work:

```bash
sudo xcode-select --reset
```

After installing, you may need to restart your terminal.

## Step 1: Create .env File

The `.env` file has been created in the `backend` directory with default settings.

**If your PostgreSQL credentials are different**, edit `backend/.env` and update:
```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/referconnect
```

## Step 2: Setup Python Environment

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

## Step 3: Setup Database (if not done)

```bash
# Make sure you're in the backend directory with venv activated
python3 setup_postgres_tables.py
```

## Step 4: Start Backend Server

```bash
# Make sure you're in the backend directory with venv activated
python3 main.py
```

Or use the start script:

```bash
./start_backend.sh
```

## Backend will be available at:

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Quick Start (All in One)

After fixing xcrun error:

```bash
cd backend

# Setup environment (first time only)
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Setup database (first time only)
python3 setup_postgres_tables.py

# Start server
python3 main.py
```

## Troubleshooting

### Database Connection Error

If you get a database connection error:

1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify database exists in pgAdmin

3. Update `DATABASE_URL` in `.env` with correct credentials

### Port Already in Use

If port 8000 is already in use:

1. Change port in `main.py` or set `PORT` environment variable:
   ```bash
   export PORT=8001
   python3 main.py
   ```

### Module Not Found

If you get "Module not found" errors:

1. Make sure virtual environment is activated:
   ```bash
   source venv/bin/activate
   ```

2. Reinstall dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Using the Start Script

You can also use the provided start script:

```bash
cd backend
./start_backend.sh
```

This script will:
- Check if virtual environment exists
- Activate it
- Check if .env file exists
- Start the server


