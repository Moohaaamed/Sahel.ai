import importlib
import os
import sys
from pathlib import Path
from types import SimpleNamespace

from fastapi.testclient import TestClient


BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

os.environ["GROQ_API_KEY"] = "test-groq-key"
os.environ["APP_SECRET_KEY"] = "test-secret-key-for-pytest-with-32-plus-bytes"
os.environ["DATABASE_URL"] = f"sqlite:///{BASE_DIR / 'test_sahel.db'}"
os.environ["AUTO_CREATE_TABLES"] = "true"

backend_chatdoc = importlib.import_module("backend_chatdoc")
storage = importlib.import_module("storage")


class FakeGroqClient:
    def __init__(self):
        self.last_request = None
        self.chat = SimpleNamespace(
            completions=SimpleNamespace(create=self.create_completion)
        )

    def create_completion(self, **kwargs):
        self.last_request = kwargs
        system_prompt = kwargs["messages"][0]["content"]
        if "Answer entirely in French" in system_prompt:
            answer = "Bonjour, voici une reponse basee sur les informations disponibles."
        elif "Answer entirely in Arabic" in system_prompt:
            answer = "مرحبا، هذه إجابة اعتمادا على المعلومات المتوفرة."
        else:
            answer = "Hello, here is an answer based on the available information."
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=answer))]
        )


def clear_database():
    for table_name in [
        "messages",
        "conversations",
        "inquiries",
        "documents",
        "businesses",
        "owners",
    ]:
        storage.write_table(table_name, [])


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def create_owner_and_business(client):
    owner_response = client.post(
        "/owners/register",
        json={
            "full_name": "Test Owner",
            "email": "owner@example.com",
            "password": "secret123",
        },
    )
    assert owner_response.status_code == 200
    token = owner_response.json()["token"]

    business_response = client.post(
        "/businesses",
        headers=auth_headers(token),
        json={
            "name": "Cafe Atlas",
            "business_type": "restaurant",
            "description": "Cafe marocain a Tinghir avec petit dejeuner.",
            "owner_email": "contact@atlas.example",
            "owner_phone": "+212612345678",
        },
    )
    assert business_response.status_code == 200
    return token, business_response.json()


def setup_function():
    clear_database()
    backend_chatdoc.client = FakeGroqClient()


def teardown_module():
    storage.engine.dispose()
    test_db = BASE_DIR / "test_sahel.db"
    if test_db.exists():
        test_db.unlink()


def test_detect_language_handles_core_project_languages():
    assert backend_chatdoc.detect_language("السلام عليكم واش كاين الفطور؟") == "ar"
    assert backend_chatdoc.detect_language("Bonjour, quels sont vos horaires ?") == "fr"
    assert backend_chatdoc.detect_language("Hello, are you open today?") == "en"
    assert backend_chatdoc.detect_language("Salam, bghit reservation") == "ar"


def test_owner_business_chat_and_analytics_flow():
    client = TestClient(backend_chatdoc.app)
    token, business = create_owner_and_business(client)

    chat_response = client.post(
        f"/businesses/{business['slug']}/chat",
        json={"question": "Bonjour, quels sont vos horaires ?"},
    )
    assert chat_response.status_code == 200
    chat_payload = chat_response.json()
    assert chat_payload["language"] == "fr"
    assert "Bonjour" in chat_payload["answer"]
    assert chat_payload["conversation_id"]

    system_prompt = backend_chatdoc.client.last_request["messages"][0]["content"]
    assert "Answer entirely in French" in system_prompt
    assert "Never invent prices" in system_prompt

    analytics_response = client.get(
        f"/businesses/{business['id']}/analytics",
        headers=auth_headers(token),
    )
    assert analytics_response.status_code == 200
    analytics = analytics_response.json()
    assert analytics["total_messages"] == 1
    assert analytics["total_conversations"] == 1
    assert analytics["language_counts"]["fr"] == 1
    assert analytics["top_questions"][0]["question"] == "Bonjour, quels sont vos horaires ?"


def test_inquiry_lifecycle_for_owner_dashboard():
    client = TestClient(backend_chatdoc.app)
    token, business = create_owner_and_business(client)

    create_response = client.post(
        f"/businesses/{business['slug']}/inquiries",
        json={
            "name": "Visitor",
            "contact": "+212600000000",
            "message": "Je veux reserver une table.",
        },
    )
    assert create_response.status_code == 200
    inquiry = create_response.json()
    assert inquiry["status"] == "new"

    list_response = client.get(
        f"/businesses/{business['id']}/inquiries",
        headers=auth_headers(token),
    )
    assert list_response.status_code == 200
    assert list_response.json()["inquiries"][0]["id"] == inquiry["id"]

    update_response = client.patch(
        f"/businesses/{business['id']}/inquiries/{inquiry['id']}",
        headers=auth_headers(token),
        json={"status": "contacted"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "contacted"
    assert update_response.json()["updated_at"]


def test_owner_auth_required_for_private_business_data():
    client = TestClient(backend_chatdoc.app)
    _, business = create_owner_and_business(client)

    response = client.get(f"/businesses/{business['id']}/analytics")
    assert response.status_code == 401

    public_response = client.get(f"/businesses/{business['slug']}")
    assert public_response.status_code == 200
    assert public_response.json()["slug"] == business["slug"]
