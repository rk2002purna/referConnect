import psycopg2

# Connect to database
conn = psycopg2.connect('postgresql://postgres:kanna@localhost:5432/referConnect')
cursor = conn.cursor()

try:
    # Add missing columns to users table
    alter_queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_domain VARCHAR(255);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(500);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;",
    ]
    
    for query in alter_queries:
        cursor.execute(query)
        print(f"Executed: {query}")
    
    # Update email_domain for existing users
    cursor.execute("UPDATE users SET email_domain = split_part(email, '@', 2) WHERE email_domain IS NULL;")
    print("Updated email_domain for existing users")
    
    # Add indexes
    index_queries = [
        "CREATE INDEX IF NOT EXISTS idx_users_email_domain ON users(email_domain);",
        "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);",
    ]
    
    for query in index_queries:
        cursor.execute(query)
        print(f"Executed: {query}")
    
    conn.commit()
    print("✅ Database schema updated successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
