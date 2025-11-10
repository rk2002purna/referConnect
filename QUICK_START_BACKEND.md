# Quick Start: Create Tables & Start Backend

## 🗄️ Step 1: Create Tables in pgAdmin

### In pgAdmin:

1. **Open pgAdmin**
2. **Connect to your PostgreSQL server**
3. **Right-click on "ReferConnect" database** → **Query Tool**
4. **Open file**: `backend/create_all_tables.sql`
5. **Copy ALL the SQL** from that file
6. **Paste into Query Tool**
7. **Click Execute** (or press F5)
8. **Wait for**: "✅ All tables created successfully!"

### Verify Tables Created:

In pgAdmin, expand:
- ReferConnect database
- Schemas → public → Tables

You should see these tables:
- ✅ users
- ✅ companies  
- ✅ verified_companies
- ✅ job_seekers
- ✅ employees
- ✅ jobs
- ✅ referrals
- ✅ employee_verifications
- ✅ otp_verifications
- ✅ id_card_verifications

## 🌱 Step 2: Seed Companies Data (Optional)

1. **In pgAdmin Query Tool** (still on ReferConnect database)
2. **Open file**: `backend/seed_companies_data.sql`
3. **Copy ALL the SQL**
4. **Paste and Execute**
5. **Wait for**: "✅ Companies seeded successfully!"

## 🚀 Step 3: Start Backend Service

### Command to Run:

```bash
cd /Users/pradeepdyd/referconnect-frontend
./start_backend.sh
```

### Or Manual Command:

```bash
cd /Users/pradeepdyd/referconnect-frontend/backend
export $(cat .env | grep -v '^#' | xargs)
python3 main.py
```

## ✅ Step 4: Verify Backend is Running

Open in browser:
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs
- **API**: http://localhost:8000

## 📝 Important Notes

1. **Database Name**: Make sure `.env` has `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ReferConnect`
2. **Update Credentials**: If your PostgreSQL username/password is different, update the `.env` file
3. **PostgreSQL Running**: Make sure PostgreSQL is running before starting backend

## 🔧 Troubleshooting

### If backend fails to start:

1. **Check database connection**:
   ```bash
   # Test connection (update credentials if needed)
   psql -h localhost -U postgres -d ReferConnect
   ```

2. **Check .env file**:
   ```bash
   cat backend/.env | grep DATABASE_URL
   ```

3. **Install Python dependencies**:
   ```bash
   cd backend
   pip3 install -r requirements.txt
   ```

## 📋 Summary

1. ✅ Run `create_all_tables.sql` in pgAdmin
2. ✅ (Optional) Run `seed_companies_data.sql` in pgAdmin  
3. ✅ Run `./start_backend.sh` or `python3 main.py`
4. ✅ Access http://localhost:8000/docs


