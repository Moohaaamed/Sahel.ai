import urllib.request, json
r = urllib.request.urlopen('http://localhost:8000/businesses')
data = json.loads(r.read())
for b in data.get('businesses', []):
    sm = b.get('social_media', '')
    sm_preview = repr(sm[:80]) if sm else '(empty)'
    print(f'{b["name"]:35s} social_media={sm_preview}')
