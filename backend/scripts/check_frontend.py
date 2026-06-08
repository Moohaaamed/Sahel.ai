import urllib.request
import re
r = urllib.request.urlopen('http://localhost:5173')
html = r.read().decode('utf-8', errors='replace')
scripts = re.findall(r'src="([^"]+\.(?:js|ts|jsx|tsx))"', html)
for s in scripts:
    print(s)
idx = html.lower().find('error')
if idx >= 0:
    print('\nError context:', html[max(0,idx-50):idx+100])
else:
    print('No error found')
