import urllib.request, json

SOCIAL_PRESETS = {
    "Restaurant Amoudou": {"instagram": "https://instagram.com/amoudou.marrakech", "facebook": "https://facebook.com/amoudou.marrakech"},
    "Poissonnerie Ajami": {"instagram": "https://instagram.com/ajami.casablanca", "facebook": "https://facebook.com/ajami.casablanca"},
    "Riad Snan": {"instagram": "https://instagram.com/riad_snan", "facebook": "https://facebook.com/riad_snan"},
    "H\u00f4tel Tichka": {"instagram": "https://instagram.com/hotel_tichka", "facebook": "https://facebook.com/hotel_tichka"},
    "Riad El Fenn": {"instagram": "https://instagram.com/riad_el_fenn", "facebook": "https://facebook.com/riad_el_fenn"},
    "Kasbah du Toubkal": {"instagram": "https://instagram.com/kasbah_toubkal", "facebook": "https://facebook.com/kasbah_toubkal"},
    "Auto-Hall M\u00e9canique": {"facebook": "https://facebook.com/autohall.casablanca"},
    "Salon Hicham Coiffure": {"instagram": "https://instagram.com/salon_hicham", "facebook": "https://facebook.com/salon_hicham"},
    "Cabinet Avocats El Amrani": {"linkedin": "https://linkedin.com/company/el-amrani-law"},
    "Boutique Artisanale Tinfou": {"instagram": "https://instagram.com/tinfou.artisanat", "facebook": "https://facebook.com/tinfou.artisanat"},
    "\u00c9picerie Bab El Hadid": {"facebook": "https://facebook.com/bab.elhadid.fes"},
    "Studio Cr\u00e9atif Kenza": {"instagram": "https://instagram.com/studio_kenza", "linkedin": "https://linkedin.com/company/kenza-studio"},
}

r = urllib.request.urlopen('http://localhost:8000/businesses')
data = json.loads(r.read())
businesses = data.get('businesses', [])

for b in businesses:
    name = b['name']
    if name in SOCIAL_PRESETS:
        sm = json.dumps(SOCIAL_PRESETS[name])
        payload = json.dumps({"name": b['name'], "business_type": b.get('business_type', ''), "description": b.get('description', ''), "social_media": sm}).encode()
        req = urllib.request.Request(f'http://localhost:8000/businesses/{b["id"]}', data=payload, method='PUT', headers={'Content-Type': 'application/json'})
        try:
            resp = urllib.request.urlopen(req)
            print(f'OK: {name} -> social_media set')
        except Exception as e:
            print(f'FAIL: {name}: {e}')
    else:
        print(f'SKIP: {name} (no preset)')

print('Done')
