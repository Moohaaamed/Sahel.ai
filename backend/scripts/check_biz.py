import sqlite3
conn = sqlite3.connect('sahel.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print('Tables:', tables)
try:
    cursor.execute("SELECT id, name, business_type, city, slug FROM businesses LIMIT 20")
    rows = cursor.fetchall()
    print(f'Businesses ({len(rows)}):')
    for r in rows:
        print(r)
except Exception as e:
    print('Error:', e)
cursor.execute("PRAGMA table_info(businesses)")
cols = cursor.fetchall()
print('Columns:', cols)
conn.close()
