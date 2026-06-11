import hashlib, uuid, sqlite3, os

db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sahel.db")
salt = uuid.uuid4().hex
digest = hashlib.pbkdf2_hmac("sha256", "demo123".encode(), salt.encode(), 600000).hex()
new_hash = f"{salt}${digest}"

conn = sqlite3.connect(db_path)
conn.execute("UPDATE owners SET password_hash=? WHERE id=?", (new_hash, "demo-owner"))
conn.commit()
conn.close()
print("Updated password hash for demo-owner")
