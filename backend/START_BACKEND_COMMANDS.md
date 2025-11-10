# Commands to Create Tables and Start Backend

## Step 1: Create Tables in pgAdmin

1. **Open pgAdmin** and connect to your PostgreSQL server
2. **Navigate to the "ReferConnect" database** (right-click → Query Tool)
3. **Open the SQL file**: `backend/create_all_tables.sql`
4. **Copy and paste** the entire SQL content into the Query Tool
5. **Click Execute** (or press F5)
6. **Wait for success message**: "✅ All tables created successfully!"

## Step 2: Seed Companies Data (Optional but Recommended)

1. **In pgAdmin Query Tool** on the ReferConnect database
2. **Open the SQL file**: `backend/seed_companies_data.sql`
3. **Copy and paste** the entire SQL content
4. **Click Execute** (or press F5)
5. **Wait for success message**: "✅ Companies seeded successfully!"

## Step 3: Update .env File

Make sure your `backend/.env` file has the correct database name:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ReferConnect
```

**Note**: Replace `postgres:postgres` with your actual PostgreSQL username and password if different.

## Step 4: Start Backend Service

### Option A: Using the Start Script (Recommended)

```bash
cd /Users/pradeepdyd/referconnect-frontend
./start_backend.sh
```

### Option B: Manual Start

```bash
cd /Users/pradeepdyd/referconnect-frontend/backend

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Start the server
python3 main.py
```

### Option C: Using uvicorn directly

```bash
cd /Users/pradeepdyd/referconnect-frontend/backend

# Load environment variables
source .env  # or export variables manually

# Start with uvicorn
uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000 --reload
```

## Step 5: Verify Backend is Running

Once started, you should see:
```
🚀 Starting ReferConnect API on 0.0.0.0:8000
📊 Using database: postgresql://postgres:***@localhost:5432/ReferConnect
✅ Database tables created successfully
```

**Access the backend:**
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **ReDoc**: http://localhost:8000/redoc

## Troubleshooting

### Database Connection Error

If you get a connection error:
1. Check PostgreSQL is running
2. Verify database "ReferConnect" exists in pgAdmin
3. Update DATABASE_URL in `.env` with correct credentials
4. Make sure the database name matches exactly (case-sensitive if quoted)

### Port Already in Use

If port 8000 is already in use:
```bash
# Change port in .env or set environment variable
export PORT=8001
python3 main.py
```

### Python Not Found / xcrun Error

If you see xcrun errors:
```bash
# Install Command Line Tools
xcode-select --install

# Or reset if already installed
sudo xcode-select --reset
```

### Module Not Found

If you get "Module not found" errors:
```bash
cd backend
pip3 install -r requirements.txt
```

## Quick Reference

**Create tables**: Run `create_all_tables.sql` in pgAdmin
**Seed data**: Run `seed_companies_data.sql` in pgAdmin  
**Start backend**: `./start_backend.sh` or `python3 main.py`
**Check health**: http://localhost:8000/health


