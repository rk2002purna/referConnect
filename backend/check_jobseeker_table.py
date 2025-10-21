import psycopg2
import os

# Connect to database
conn = psycopg2.connect(os.getenv('DATABASE_URL', 'postgresql://postgres:kanna@localhost:5432/referConnect'))
cursor = conn.cursor()

try:
    # Check if job_seekers table exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'job_seekers'
        );
    """)
    
    table_exists = cursor.fetchone()[0]
    print(f"job_seekers table exists: {table_exists}")
    
    if not table_exists:
        print("Creating job_seekers table...")
        cursor.execute("""
            CREATE TABLE job_seekers (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                skills TEXT,
                years_experience INTEGER,
                current_company VARCHAR(255),
                privacy_excluded_companies TEXT,
                trust_score INTEGER DEFAULT 0,
                resume_filename VARCHAR(255),
                resume_path VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        print("job_seekers table created successfully!")
    else:
        print("job_seekers table already exists")
        
        # Check table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'job_seekers'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("\nTable structure:")
        for col in columns:
            print(f"  {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
    
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
