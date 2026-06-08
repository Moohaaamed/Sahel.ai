"""Seed Hotel Saghro business + sample conversations into PostgreSQL."""
import json
import os
import sys
from datetime import datetime, timezone
from uuid import uuid4

# Ensure we can import from the backend directory
sys.path.insert(0, os.path.dirname(__file__))
from storage import (
    read_table,
    write_table,
    SessionLocal,
    BusinessModel,
    DocumentModel,
    MessageModel,
    ConversationModel,
)

BUSINESS_ID = "a10000000013"

BUSINESS = {
    "id": BUSINESS_ID,
    "owner_id": "demo-owner",
    "slug": "saghro",
    "name": "Hotel Saghro",
    "business_type": "hotel",
    "description": "H\u00f4tel 4**** situ\u00e9 en plein centre-ville de Tinghir offrant une vue panoramique sur la vall\u00e9e de Toudgha et les montagnes de l'Atlas. 65 chambres avec balcon priv\u00e9, piscine ext\u00e9rieure, restaurant, bar et services h\u00f4teliers complets.",
    "owner_email": "saghrotinghir@gmail.com",
    "owner_phone": "+212 524 834 179",
    "city": "Tinghir",
    "address": "Av. des FAR, Centre Tinghir, 45800, Maroc",
    "working_hours": "R\u00e9ception 24h/24",
    "primary_services": "H\u00e9bergement, Piscine ext\u00e9rieure, Restaurant, Bar, Petit-d\u00e9jeuner buffet, Room service, Excursions Gorges Todgha, Laverie, Transfert a\u00e9roport",
    "site_url": "/b/saghro",
    "chat_url": "/chat/saghro",
    "highlights": "Vue panoramique vall\u00e9e Toudgha, Piscine ext\u00e9rieure, 65 chambres climatis\u00e9es, Proche Gorges du Todgha, Parking gratuit, Wi-Fi gratuit, Personnel multilingue",
    "public_knowledge": "Hotel Saghro est un h\u00f4tel 4 \u00e9toiles situ\u00e9 au centre de Tinghir. 65 chambres avec salle de bain, clim, coffre-fort, balcon. Tarifs: simple 50\u20ac, double 70\u20ac, triple 90\u20ac/nuit. Petit-d\u00e9jeuner buffet inclus. Check-out 12h. Piscine ext\u00e9rieure. Restaurant cuisine marocaine et internationale. Bar 10h-23h. Room service 24h. Excursions aux Gorges du Todgha (9 km). Parking gratuit. Wi-Fi gratuit. Animaux accept\u00e9s. R\u00e9ception 24h.",
    "latitude": None,
    "longitude": None,
    "cover_image_url": None,
    "ice": None,
    "rc": None,
    "if_tax": None,
    "patente": None,
    "cnss": None,
    "legal_form": "SARL",
}

DOCUMENTS = [
    {
        "id": "d000000000013",
        "business_id": BUSINESS_ID,
        "file_name": "Brochure Hotel Saghro.pdf",
        "file_type": "application/pdf",
        "file_url": "/uploaded_documents/a10000000013/Brochure Hotel Saghro.pdf",
        "chunks": 0,
        "size_bytes": 0,
        "uploaded_at": "2026-06-05T00:00:00+00:00",
    },
    {
        "id": "d000000000014",
        "business_id": BUSINESS_ID,
        "file_name": "Menu Restaurant Saghro.pdf",
        "file_type": "application/pdf",
        "file_url": "/uploaded_documents/a10000000013/Menu Restaurant Saghro.pdf",
        "chunks": 0,
        "size_bytes": 0,
        "uploaded_at": "2026-06-05T00:00:00+00:00",
    },
]

SAMPLE_CONVERSATIONS = [
    # Conversation 1 — French
    {
        "conversation_id": "saghro-conv-001",
        "language": "fr",
        "messages": [
            {"q": "Bonjour, quels sont les tarifs des chambres ?", "a": "Nos chambres simples sont à partir de 50€, doubles à partir de 70€ et triples à partir de 90€ par nuit. Le petit-déjeuner buffet est inclus."},
            {"q": "Est-ce que vous avez une piscine ?", "a": "Oui, nous avons une piscine extérieure ouverte de mai à octobre. Elle est située dans notre jardin avec des chaises longues et des parasols."},
            {"q": "Quels sont les horaires du restaurant ?", "a": "Notre restaurant est ouvert le midi de 12h à 14h30 et le soir de 19h à 22h30. Nous servons une cuisine marocaine traditionnelle et des plats internationaux."},
            {"q": "Proposez-vous le petit-déjeuner ?", "a": "Oui, le petit-déjeuner buffet est inclus dans le prix de la chambre. Il est servi de 7h à 10h30 et comprend des viennoiseries, pains, fruits, jus, café et thé."},
        ],
    },
    # Conversation 2 — English
    {
        "conversation_id": "saghro-conv-002",
        "language": "en",
        "messages": [
            {"q": "Hello, how far is the hotel from Todgha Gorge?", "a": "The Todgha Gorge is approximately 9 km (5.8 miles) from Hotel Saghro, about a 15-minute drive. We can arrange a taxi or excursions for you at the reception."},
            {"q": "Do you have free parking?", "a": "Yes, we offer free parking for all our guests. The parking is secure and located right next to the hotel."},
            {"q": "Is Wi-Fi available?", "a": "Yes, Wi-Fi is available free of charge throughout the hotel including in all rooms and common areas."},
        ],
    },
    # Conversation 3 — Darija
    {
        "conversation_id": "saghro-conv-003",
        "language": "ar",
        "messages": [
            {"q": "السلام عليكم، واش عندكم غرف فاضية هاد السيمانة؟", "a": "وعليكم السلام. نعم، تتوفر لدينا غرف متاحة هذا الأسبوع. يرجى الاتصال بنا على +212 524 834 179 للحجز والتأكد من التوفر."},
            {"q": "شحال الثمن ف الليلة؟", "a": "أسعار الغرف: الغرفة الفردية ابتداء من 50 يورو، الغرفة المزدوجة ابتداء من 70 يورو، والغرفة الثلاثية ابتداء من 90 يورو لليلة الواحدة. الإفطار مشمول في السعر."},
            {"q": "فين كاين الفندق بالضبط؟", "a": "الفندق يقع في وسط مدينة تنغير، شارع القوات المسلحة الملكية. إطلالة رائعة على وادي تودغا وجبال الأطلس."},
        ],
    },
    # Conversation 4 — French (couple asking about stay)
    {
        "conversation_id": "saghro-conv-004",
        "language": "fr",
        "messages": [
            {"q": "Bonjour, est-ce que vous avez des chambres avec vue sur la vallée ?", "a": "Oui, toutes nos chambres disposent d'un balcon privé avec vue panoramique sur la vallée de Toudgha et les montagnes de l'Atlas."},
            {"q": "Acceptez-vous les animaux ?", "a": "Oui, les animaux sont acceptés sur demande préalable. Veuillez nous contacter avant votre réservation pour confirmer."},
            {"q": "Quels sont les moyens de paiement acceptés ?", "a": "Nous acceptons les paiements en espèces, par carte bancaire (Visa, Mastercard) et par virement bancaire."},
        ],
    },
    # Conversation 5 — English (tourist planning trip)
    {
        "conversation_id": "saghro-conv-005",
        "language": "en",
        "messages": [
            {"q": "What excursions do you offer?", "a": "We offer excursions to Todgha Gorge, Dades Valley, and the Rose Valley in Kelaat Mgouna. We can also arrange 4x4 desert trips and guided hikes in the Atlas Mountains. Please ask at reception for prices and schedules."},
            {"q": "Do you have airport transfer service?", "a": "Yes, we offer airport transfer service. Please contact us in advance to arrange pick-up from Sale Airport or Errachidia Airport. Rates depend on the distance and number of passengers."},
            {"q": "What languages do your staff speak?", "a": "Our staff speaks Arabic, French, English, and Spanish. We also have guides who speak German and Italian for excursions."},
        ],
    },
    # Conversation 6 — French (business client)
    {
        "conversation_id": "saghro-conv-006",
        "language": "fr",
        "messages": [
            {"q": "Avez-vous des salles de réunion ?", "a": "Oui, nous disposons d'une salle de réunion équipée pouvant accueillir jusqu'à 30 personnes. Elle est équipée de Wi-Fi, vidéoprojecteur et paperboard."},
            {"q": "Proposez-vous des formules pour séminaires ?", "a": "Oui, nous proposons des forfaits séminaires incluant salle de réunion, pause-café, déjeuner et hébergement. Contactez-nous pour un devis personnalisé."},
        ],
    },
    # Conversation 7 — Darija (family)
    {
        "conversation_id": "saghro-conv-007",
        "language": "ar",
        "messages": [
            {"q": "واش كاين مطعم فالفندق؟", "a": "نعم، يوجد مطعم في الفندق يقدم المأكولات المغربية التقليدية والعالمية. مفتوح على الغداء من 12h إلى 14h30 والعشاء من 19h إلى 22h30."},
            {"q": "بغيت نحجز غرفة لعائلة، شحال الثمن؟", "a": "الغرفة الثلاثية مناسبة للعائلة بسعر 90 يورو لليلة الواحدة مع الإفطار. يمكن إضافة سرير إضافي للأطفال بتكلفة إضافية."},
        ],
    },
    # Conversation 8 — English (checking facilities)
    {
        "conversation_id": "saghro-conv-008",
        "language": "en",
        "messages": [
            {"q": "Is there a gym or spa at the hotel?", "a": "We do not have a gym or spa on site, but we can arrange hammam and massage treatments at a nearby partner facility. Please ask at reception for more information."},
            {"q": "Do you have room service?", "a": "Yes, room service is available 24 hours a day. You can order from our restaurant menu directly to your room."},
        ],
    },
]


def seed():
    # 1. Seed business
    businesses = read_table("businesses")
    existing = [b for b in businesses if b["id"] == BUSINESS_ID]
    if not existing:
        businesses.append(BUSINESS)
        write_table("businesses", businesses)
        print(f"✓ Business '{BUSINESS['name']}' added")
    else:
        print(f"→ Business '{BUSINESS['name']}' already exists")

    # 2. Seed documents
    documents = read_table("documents")
    existing_doc_ids = {d["id"] for d in documents}
    new_docs = [d for d in DOCUMENTS if d["id"] not in existing_doc_ids]
    if new_docs:
        documents.extend(new_docs)
        write_table("documents", documents)
        print(f"✓ Added {len(new_docs)} document(s)")
    else:
        print("→ Documents already exist")

    # 3. Seed sample conversations & messages
    messages = read_table("messages")
    conversations = read_table("conversations")
    existing_conv_ids = {c["id"] for c in conversations}

    now = datetime.now(timezone.utc)
    msg_count = 0
    conv_count = 0

    for conv in SAMPLE_CONVERSATIONS:
        cid = conv["conversation_id"]
        lang = conv["language"]
        if cid in existing_conv_ids:
            continue

        conversations.append({
            "id": cid,
            "business_id": BUSINESS_ID,
            "language": lang,
            "visitor_ip": None,
            "started_at": now.isoformat(),
        })
        conv_count += 1

        for i, m in enumerate(conv["messages"]):
            messages.append({
                "id": uuid4().hex[:12],
                "business_id": BUSINESS_ID,
                "conversation_id": cid,
                "question": m["q"],
                "answer": m["a"],
                "sources": json.dumps([]),
                "language": lang,
                "created_at": now.isoformat(),
            })
            msg_count += 1

    if conv_count > 0:
        write_table("conversations", conversations)
        write_table("messages", messages)
        print(f"✓ Added {conv_count} conversation(s) with {msg_count} message(s)")
    else:
        print("→ Sample conversations already exist")

    total_messages = len(read_table("messages"))
    total_convs = len([c for c in read_table("conversations") if c["business_id"] == BUSINESS_ID])
    print(f"\n📊 Hotel Saghro stats: {total_convs} conversations, {total_messages} messages")


if __name__ == "__main__":
    seed()
