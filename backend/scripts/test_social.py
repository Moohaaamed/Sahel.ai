import urllib.request, json

token = 'REPLACE_WITH_VALID_TOKEN'

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
    "http://localhost:8001/businesses",
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
