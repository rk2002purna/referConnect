import psycopg2

conn = psycopg2.connect('postgresql://postgres:kanna@localhost:5432/referConnect')
cursor = conn.cursor()

cursor.execute("""
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY column_name;
""")

columns = cursor.fetchall()
print('Current users table columns:')
for col in columns:
    print(f'  - {col[0]} ({col[1]})')

cursor.close()
conn.close()
