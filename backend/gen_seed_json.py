"""Generate messages.json and conversations.json from seed data."""
import json, uuid
from datetime import datetime, timezone

BUSINESS_ID = "a10000000013"

SAMPLE_CONVERSATIONS = [
    {
        "conversation_id": "saghro-conv-001",
        "language": "fr",
        "messages": [
            {"q": "Bonjour, quels sont les tarifs des chambres ?", "a": "Nos chambres simples sont à partir de 50€, doubles à partir de 70€ et triples à partir de 90€ par nuit. Le petit-déjeuner buffet est inclus."},
            {"q": "Est-ce que vous avez une piscine ?", "a": "Oui, nous avons une piscine extérieure ouverte de mai à octobre."},
            {"q": "Quels sont les horaires du restaurant ?", "a": "Notre restaurant est ouvert le midi de 12h à 14h30 et le soir de 19h à 22h30."},
            {"q": "Proposez-vous le petit-déjeuner ?", "a": "Oui, le petit-déjeuner buffet est inclus dans le prix de la chambre."},
        ],
    },
    {
        "conversation_id": "saghro-conv-002",
        "language": "en",
        "messages": [
            {"q": "Hello, how far is the hotel from Todgha Gorge?", "a": "The Todgha Gorge is approximately 9 km from Hotel Saghro."},
            {"q": "Do you have free parking?", "a": "Yes, we offer free parking for all our guests."},
            {"q": "Is Wi-Fi available?", "a": "Yes, Wi-Fi is available free of charge throughout the hotel."},
        ],
    },
    {
        "conversation_id": "saghro-conv-003",
        "language": "ar",
        "messages": [
            {"q": "السلام عليكم، واش عندكم غرف فاضية هاد السيمانة؟", "a": "وعليكم السلام. نعم، تتوفر لدينا غرف متاحة هذا الأسبوع."},
            {"q": "شحال الثمن ف الليلة؟", "a": "أسعار الغرف: الغرفة الفردية ابتداء من 50 يورو."},
            {"q": "فين كاين الفندق بالضبط؟", "a": "الفندق يقع في وسط مدينة تنغير."},
        ],
    },
    {
        "conversation_id": "saghro-conv-004",
        "language": "fr",
        "messages": [
            {"q": "Bonjour, est-ce que vous avez des chambres avec vue sur la vallée ?", "a": "Oui, toutes nos chambres disposent d'un balcon privé avec vue panoramique."},
            {"q": "Acceptez-vous les animaux ?", "a": "Oui, les animaux sont acceptés sur demande préalable."},
            {"q": "Quels sont les moyens de paiement acceptés ?", "a": "Nous acceptons les paiements en espèces, par carte bancaire."},
        ],
    },
    {
        "conversation_id": "saghro-conv-005",
        "language": "en",
        "messages": [
            {"q": "What excursions do you offer?", "a": "We offer excursions to Todgha Gorge, Dades Valley, and the Rose Valley."},
            {"q": "Do you have airport transfer service?", "a": "Yes, we offer airport transfer service."},
            {"q": "What languages do your staff speak?", "a": "Our staff speaks Arabic, French, English, and Spanish."},
        ],
    },
    {
        "conversation_id": "saghro-conv-006",
        "language": "fr",
        "messages": [
            {"q": "Avez-vous des salles de réunion ?", "a": "Oui, nous disposons d'une salle de réunion équipée."},
            {"q": "Proposez-vous des formules pour séminaires ?", "a": "Oui, nous proposons des forfaits séminaires."},
        ],
    },
    {
        "conversation_id": "saghro-conv-007",
        "language": "ar",
        "messages": [
            {"q": "واش كاين مطعم فالفندق؟", "a": "نعم، يوجد مطعم في الفندق يقدم المأكولات المغربية."},
            {"q": "بغيت نحجز غرفة لعائلة، شحال الثمن؟", "a": "الغرفة الثلاثية مناسبة للعائلة بسعر 90 يورو."},
        ],
    },
    {
        "conversation_id": "saghro-conv-008",
        "language": "en",
        "messages": [
            {"q": "Is there a gym or spa at the hotel?", "a": "We do not have a gym or spa on site."},
            {"q": "Do you have room service?", "a": "Yes, room service is available 24 hours a day."},
        ],
    },
]

now = datetime.now(timezone.utc).isoformat()
conversations = []
messages = []

for conv in SAMPLE_CONVERSATIONS:
    cid = conv["conversation_id"]
    conversations.append({
        "id": cid,
        "business_id": BUSINESS_ID,
        "language": conv["language"],
        "visitor_ip": None,
        "started_at": now,
    })
    for m in conv["messages"]:
        messages.append({
            "id": uuid.uuid4().hex[:12],
            "business_id": BUSINESS_ID,
            "conversation_id": cid,
            "question": m["q"],
            "answer": m["a"],
            "sources": json.dumps([]),
            "language": conv["language"],
            "created_at": now,
        })

import os
data_dir = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(data_dir, exist_ok=True)

with open(os.path.join(data_dir, "messages.json"), "w", encoding="utf-8") as f:
    json.dump(messages, f, ensure_ascii=False, indent=2)

with open(os.path.join(data_dir, "conversations.json"), "w", encoding="utf-8") as f:
    json.dump(conversations, f, ensure_ascii=False, indent=2)

print(f"Generated {len(messages)} messages, {len(conversations)} conversations")
