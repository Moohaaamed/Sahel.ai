"""Generate Hotel Saghro PDF flyer."""
from fpdf import FPDF
import os

PDF_PATH = os.path.join(os.path.dirname(__file__), "..", "website", "public", "flyer-hotel-saghro.pdf")


class SaghroFlyer(FPDF):
    pass


pdf = SaghroFlyer("P", "mm", "A4")
pdf.set_auto_page_break(auto=False)

# --- Front face ---
pdf.add_page()

# Background color (deep navy)
pdf.set_fill_color(15, 23, 42)
pdf.rect(0, 0, 210, 297, "F")

# Gold accent line
pdf.set_fill_color(212, 175, 55)
pdf.rect(0, 0, 210, 6, "F")

# Hotel name
pdf.set_text_color(255, 255, 255)
pdf.set_font("Helvetica", "B", 36)
pdf.set_xy(20, 30)
pdf.cell(170, 14, "Hotel Saghro", align="C")

# Stars
pdf.set_font("Helvetica", "", 28)
pdf.set_xy(20, 46)
pdf.cell(170, 12, "\xE2\x98\x85 \xE2\x98\x85 \xE2\x98\x85 \xE2\x98\x85", align="C")

# Tagline
pdf.set_font("Helvetica", "I", 14)
pdf.set_text_color(212, 175, 55)
pdf.set_xy(20, 60)
pdf.cell(170, 8, '"L\'esprit du haut Atlas marocain"', align="C")

# Subtitle
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(200, 200, 200)
pdf.set_xy(20, 75)
pdf.cell(170, 10, "Tinghir \xE2\x80\x93 Vall\xE9e de Toudgha \xE2\x80\x93 Maroc", align="C")

# Divider
pdf.set_draw_color(212, 175, 55)
pdf.set_line_width(0.5)
pdf.line(60, 92, 150, 92)

# Key features
features = [
    ("65 chambres", "Climatis\xE9es, balcon priv\xE9, coffre-fort, t\xE9l\xE9phone"),
    ("Piscine ext\xE9rieure", "Ouverte de mai \xE0 octobre \xE2\x80\x93 Jardin et solarium"),
    ("Restaurant", "Cuisine marocaine et internationale \xE2\x80\x93 Midi et soir"),
    ("Bar", "Ouvert de 10h \xE0 23h \xE2\x80\x93 Vue panoramique"),
    ("Room service", "24h/24 \xE2\x80\x93 Service en chambre"),
    ("Wi-Fi gratuit", "Dans tout l\'h\xF4tel \xE2\x80\x93 Parking gratuit"),
]

pdf.set_text_color(255, 255, 255)
pdf.set_font("Helvetica", "B", 12)
y = 110
for title, desc in features:
    pdf.set_xy(30, y)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(212, 175, 55)
    pdf.cell(80, 7, f"\xE2\x96\xB8  {title}")
    pdf.set_xy(30, y + 7)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(200, 200, 200)
    pdf.cell(150, 6, desc)
    y += 18

# Location
pdf.set_font("Helvetica", "B", 11)
pdf.set_text_color(212, 175, 55)
pdf.set_xy(20, y + 10)
pdf.cell(170, 7, "Emplacement", align="C")
pdf.set_font("Helvetica", "", 10)
pdf.set_text_color(200, 200, 200)
pdf.set_xy(20, y + 18)
pdf.cell(170, 6, "Av. des FAR, Centre Tinghir, 45800, Maroc", align="C")
pdf.set_xy(20, y + 25)
pdf.cell(170, 6, "\xC0 9 km des Gorges du Todgha", align="C")

# Contact
y2 = y + 45
pdf.set_draw_color(212, 175, 55)
pdf.line(60, y2, 150, y2)

pdf.set_font("Helvetica", "B", 14)
pdf.set_text_color(212, 175, 55)
pdf.set_xy(20, y2 + 8)
pdf.cell(170, 8, "Contact & R\xE9servation", align="C")

pdf.set_font("Helvetica", "", 12)
pdf.set_text_color(255, 255, 255)

pdf.set_xy(20, y2 + 20)
pdf.cell(170, 7, "T\xE9l : +212 524 834 179 / +212 661 572 679", align="C")
pdf.set_xy(20, y2 + 28)
pdf.cell(170, 7, "Email : saghrotinghir@gmail.com", align="C")
pdf.set_xy(20, y2 + 36)
pdf.cell(170, 7, "Web : hotelsaghro.ma / saghrohotel.ma", align="C")

# Back face - rates
pdf.add_page()
pdf.set_fill_color(15, 23, 42)
pdf.rect(0, 0, 210, 297, "F")
pdf.set_fill_color(212, 175, 55)
pdf.rect(0, 0, 210, 6, "F")

pdf.set_font("Helvetica", "B", 24)
pdf.set_text_color(212, 175, 55)
pdf.set_xy(20, 30)
pdf.cell(170, 12, "Tarifs 2026", align="C")

pdf.set_draw_color(212, 175, 55)
pdf.line(60, 48, 150, 48)

rates = [
    ("Chambre simple", "\xE0 partir de 50 \x80 / nuit"),
    ("Chambre double", "\xE0 partir de 70 \x80 / nuit"),
    ("Chambre triple", "\xE0 partir de 90 \x80 / nuit"),
    ("Petit-d\xE9jeuner", "Inclus (buffet 7h-10h30)"),
    ("Lit suppl\xE9mentaire", "Disponible \xE2\x80\x93 tarif sur demande"),
]

pdf.set_font("Helvetica", "", 12)
pdf.set_text_color(255, 255, 255)
y = 65
for title, price in rates:
    pdf.set_xy(35, y)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(212, 175, 55)
    pdf.cell(70, 8, title)
    pdf.set_text_color(200, 200, 200)
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(70, 8, price, align="R")
    y += 14

# Services
y3 = y + 15
pdf.set_draw_color(212, 175, 55)
pdf.line(60, y3, 150, y3)

pdf.set_font("Helvetica", "B", 16)
pdf.set_text_color(212, 175, 55)
pdf.set_xy(20, y3 + 8)
pdf.cell(170, 10, "Services inclus", align="C")

services_list = [
    "R\xE9ception 24h/24",
    "Connexion Wi-Fi gratuite",
    "Parking gratuit s\xE9curis\xE9",
    "Service en chambre 24h/24",
    "Petit-d\xE9jeuner buffet inclus",
    "Animaux accept\xE9s sur demande",
    "Transfert a\xE9roport",
    "Salle de r\xE9union (30 pers.)",
    "Excursions : Gorges du Todgha, Vall\xE9e du Dad\xE8s, D\xE9sert",
    "Personnel multilingue : FR, AR, EN, ES",
]

pdf.set_font("Helvetica", "", 10)
pdf.set_text_color(200, 200, 200)
y = y3 + 25
for service in services_list:
    pdf.set_xy(35, y)
    pdf.cell(160, 6, f"\xE2\x80\xA2  {service}")
    y += 6.5

# Checkout
y4 = y + 15
pdf.set_draw_color(212, 175, 55)
pdf.line(60, y4, 150, y4)
pdf.set_font("Helvetica", "B", 14)
pdf.set_text_color(212, 175, 55)
pdf.set_xy(20, y4 + 8)
pdf.cell(170, 8, "Check-out : 12h00", align="C")
pdf.set_font("Helvetica", "", 10)
pdf.set_text_color(200, 200, 200)
pdf.set_xy(20, y4 + 18)
pdf.cell(170, 6, "R\xE9servation : +212 524 834 179 | saghrotinghir@gmail.com", align="C")
pdf.set_xy(20, y4 + 25)
pdf.cell(170, 6, "hotelsaghro.ma \xE2\x80\x93 saghrohotel.ma", align="C")

os.makedirs(os.path.dirname(PDF_PATH), exist_ok=True)
pdf.output(PDF_PATH)
print(f"PDF created: {PDF_PATH}")
