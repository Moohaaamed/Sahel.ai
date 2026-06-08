import sqlite3, os

DB = os.path.join(os.path.dirname(__file__), "..", "sahel.db")
conn = sqlite3.connect(DB)
cursor = conn.execute("SELECT id, name, slug, social_media FROM businesses")
rows = cursor.fetchall()
print(f"Businesses: {len(rows)}")
for row in rows:
    print(f"  {row[0]}: {row[1]} ({row[2]}) social_media={row[3]}")
conn.close()
