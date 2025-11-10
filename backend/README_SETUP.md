# Local Database Setup Guide

Since you've already created the `referconnect` database in pgAdmin, follow these steps to complete the setup:

## Step 1: Create Backend .env File

Create a file named `.env` in the `backend` directory with the following content:

```env
ENV=dev
DEBUG=true
SECRET_KEY=dev-secret-key-change-in-production-12345
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/referconnect
CORS_ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
ALLOWED_ORIGINS=*
```

**Important:** Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your actual PostgreSQL credentials.

Common defaults:
- Username: `postgres`
- Password: (check your pgAdmin setup or PostgreSQL installation)

## Step 2: Run Automated Setup (Recommended)

```bash
cd backend
./setup_local_db.sh
```

This script will:
1. Help you create the .env file (if not exists)
2. Test the database connection
3. Set up Python virtual environment
4. Install dependencies
5. Create all database tables
6. Seed initial data

## Step 3: Manual Setup (Alternative)

If you prefer to set up manually:

### 2.1 Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2.2 Install Dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Test Database Connection

```bash
python3 test_db_connection.py
```

### 2.4 Create Database Tables

```bash
python3 setup_postgres_tables.py
```

## Step 3: Verify Database Setup

You can verify the setup in pgAdmin:

1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Navigate to `referconnect` database
4. Check the `Tables` section - you should see:
   - `users`
   - `companies`
   - `verified_companies`
   - `job_seekers`
   - `employees`
   - `jobs`
   - `referrals`
   - `employee_verifications`
   - `otp_verifications`
   - `id_card_verifications`

## Step 4: Start Backend Server

```bash
cd backend
source venv/bin/activate
python3 main.py
```

The backend will start at: http://localhost:8000
API documentation: http://localhost:8000/docs

## Troubleshooting

### Connection Error

If you get a connection error:

1. **Check PostgreSQL is running:**
   ```bash
   # On macOS
   brew services list
   # or
   pg_isready
   ```

2. **Verify database exists:**
   - Open pgAdmin
   - Check if `referconnect` database exists
   - If not, create it: Right-click "Databases" → "Create" → "Database"

3. **Check credentials:**
   - Verify username and password in `.env` file
   - Test connection in pgAdmin first

4. **Check port:**
   - Default PostgreSQL port is 5432
   - Verify in pgAdmin connection settings

### Permission Error

If you get permission errors:

1. Grant permissions to your user:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE referconnect TO your_username;
   ```

2. Or run as postgres superuser:
   ```bash
   psql -U postgres -d referconnect
   ```

### Python Dependencies Error

If you have issues with Python packages:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## Next Steps

After successful setup:

1. ✅ Start backend server: `python3 main.py`
2. ✅ Start frontend server: `npm start` (in root directory)
3. ✅ Access API docs: http://localhost:8000/docs
4. ✅ Test the application: http://localhost:3000

## Database Connection String Format

The `DATABASE_URL` format is:
```
postgresql://username:password@host:port/database
```

Examples:
- Local with default user: `postgresql://postgres:postgres@localhost:5432/referconnect`
- Local with custom user: `postgresql://myuser:mypassword@localhost:5432/referconnect`
- Remote server: `postgresql://user:pass@example.com:5432/referconnect`

## Need Help?

If you encounter issues:

1. Check the error message carefully
2. Verify database connection in pgAdmin
3. Check `.env` file has correct credentials
4. Ensure PostgreSQL is running
5. Review the setup script output for clues


