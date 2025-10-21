import psycopg2

conn = psycopg2.connect('postgresql://postgres:kanna@localhost:5432/referConnect')
cursor = conn.cursor()

cursor.execute("""
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
""")

tables = cursor.fetchall()
print('Database tables created:')
for table in tables:
    print(f'  - {table[0]}')

cursor.close()
conn.close()
