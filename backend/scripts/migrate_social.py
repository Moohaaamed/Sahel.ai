import sqlite3, os

DB = os.path.join(os.path.dirname(__file__), "..", "sahel.db")
conn = sqlite3.connect(DB)
cursor = conn.execute("PRAGMA table_info(businesses)")
cols = [row[1] for row in cursor.fetchall()]
print("Existing columns:", cols)

if "social_media" not in cols:
    conn.execute("ALTER TABLE businesses ADD COLUMN social_media TEXT")
    conn.commit()
    print("Added social_media column")
else:
    print("social_media column already exists")

conn.close()
print("Done")
