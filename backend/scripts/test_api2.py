import urllib.request, json

# Test list all businesses
print("=== GET /businesses (list) ===")
try:
    req = urllib.request.Request("http://localhost:8000/businesses")
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    print(f"OK - {len(data.get('businesses', []))} businesses")
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode()}")

print()
print("=== GET /businesses/amoudou ===")
try:
    req = urllib.request.Request("http://localhost:8000/businesses/amoudou")
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    print(f"OK - {data.get('name')}")
    print(f"social_media: {data.get('social_media')}")
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode()}")
