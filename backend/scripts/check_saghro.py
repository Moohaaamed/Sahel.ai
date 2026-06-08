import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from storage import read_table

print("=== Businesses in DB ===")
for b in read_table("businesses"):
    print(f"  {b['id']:20s} owner={b['owner_id']:15s} slug={b['slug']:25s} {b['name']}")

print("\n=== Messages for saghro ===")
msgs = [m for m in read_table("messages") if m.get("business_id") == "a10000000013"]
print(f"  Total messages: {len(msgs)}")
