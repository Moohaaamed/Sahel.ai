import urllib.request, json

# Test fetching specific business by slug
print("=== Fetch amoudou ===")
req = urllib.request.Request("http://localhost:8000/businesses/amoudou")
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print(f"Name: {data.get('name')}")
print(f"Slug: {data.get('slug')}")
print(f"Social media: {data.get('social_media')}")

# Parse and show
sm = data.get("social_media")
if sm:
    try:
        parsed = json.loads(sm)
        print(f"Parsed: {parsed}")
    except json.JSONDecodeError:
        print(f"Failed to parse: {sm}")
else:
    print("No social media")

print()
print("=== Fetch ajami ===")
req = urllib.request.Request("http://localhost:8000/businesses/ajami")
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print(f"Social media: {data.get('social_media')}")

print()
print("=== Fetch tinfou ===")
req = urllib.request.Request("http://localhost:8000/businesses/tinfou")
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print(f"Social media: {data.get('social_media')}")
