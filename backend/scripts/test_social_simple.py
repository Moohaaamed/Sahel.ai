import urllib.request, json

token = 'REPLACE_WITH_VALID_TOKEN'

# Try without social_media first to make sure PUT works
body = json.dumps({
    "name": "Restaurant Amoudou",
    "business_type": "restaurant",
    "description": "Restaurant marocain traditionnel",
    "owner_email": "contact@amoudou.ma",
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
