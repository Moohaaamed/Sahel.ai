"""Update demo owner password in PostgreSQL."""
import hashlib, uuid, os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
salt = uuid.uuid4().hex
digest = hashlib.pbkdf2_hmac("sha256", "demo123".encode(), salt.encode(), 600000).hex()
new_hash = f"{salt}${digest}"

with engine.connect() as conn:
    result = conn.execute(
        text("UPDATE owners SET password_hash = :hash WHERE id = :id"),
        {"hash": new_hash, "id": "demo-owner"}
    )
    conn.commit()
    print(f"Updated {result.rowcount} row(s)")

    # Verify
    row = conn.execute(
        text("SELECT id, email, password_hash FROM owners WHERE id = :id"),
        {"id": "demo-owner"}
    ).fetchone()
    if row:
        print(f"Owner: {row}")
    else:
        print("Owner not found — need to create it")
        email = os.getenv("DEMO_OWNER_EMAIL", "demo@sahel.ai")
        conn.execute(
            text("""
                INSERT INTO owners (id, email, full_name, password_hash, verified, created_at)
                VALUES (:id, :email, :name, :hash, 'true', NOW())
            """),
            {"id": "demo-owner", "email": email, "name": "Demo Owner", "hash": new_hash}
        )
        conn.commit()
        print("Created demo owner")
