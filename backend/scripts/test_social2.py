import urllib.request, json

# Test 1: GET all businesses (no auth)
print("=== Test 1: GET /businesses ===")
req = urllib.request.Request("http://localhost:8001/businesses")
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print(f"Businesses: {len(data['businesses'])}")
for b in data["businesses"]:
    sm = b.get("social_media", "NOT SET")
    print(f"  {b['name']} -> social_media: {sm}")

# Test 2: Update with social media
print("\n=== Test 2: PUT /businesses/amoudou with social_media ===")
token = "REPLACE_WITH_VALID_TOKEN"

social = json.dumps({"instagram": "https://instagram.com/amoudou", "facebook": "https://facebook.com/amoudou"})
body = json.dumps({
    "name": "Restaurant Amoudou",
    "business_type": "restaurant",
    "description": "Restaurant marocain traditionnel",
    "owner_email": "contact@amoudou.ma",
    "city": "Marrakech",
    "address": "12 Rue de la Kasbah",
    "latitude": 31.6295,
    "longitude": -7.9811,
    "primary_services": "Cuisine marocaine, Couscous, Tagines",
    "highlights": "Vue panoramique, Terrasse, Musique live",
    "working_hours": "09:00-23:00",
    "social_media": social,
})

req = urllib.request.Request(
    "http://localhost:8001/businesses/amoudou",
    data=body.encode(),
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    },
    method="PUT",
)

try:
    resp = urllib.request.urlopen(req)
    print("Status:", resp.status)
    print("Response:", json.loads(resp.read()))
except urllib.error.HTTPError as e:
    print("Error:", e.code, e.reason)
    print("Body:", e.read().decode())
