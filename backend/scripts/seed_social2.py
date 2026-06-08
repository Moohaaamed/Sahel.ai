import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from storage import engine, BusinessModel
from sqlalchemy.orm import sessionmaker
import json

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

Session = sessionmaker(bind=engine)
session = Session()
count = 0
for b in session.query(BusinessModel).all():
    name = b.name
    if name in SOCIAL_PRESETS:
        b.social_media = json.dumps(SOCIAL_PRESETS[name])
        count += 1
        print(f'OK: {name}')
    else:
        print(f'SKIP: {name}')
session.commit()
session.close()
print(f'\nDone: {count} businesses updated')
