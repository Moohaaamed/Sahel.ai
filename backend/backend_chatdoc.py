import asyncio
import base64
import html
import json
import logging
import os
import re
import secrets
import shutil
import hashlib
import hmac
import random
import smtplib
import time
import unicodedata
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from pathlib import Path
from collections import defaultdict
from typing import List
from uuid import uuid4

import faiss
import jwt
import numpy as np
from pypdf import PdfReader
import io
from fastapi import FastAPI, File, Header, HTTPException, Request, Response, UploadFile, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from jinja2 import Environment, FileSystemLoader, select_autoescape
import qrcode
from groq import Groq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import CharacterTextSplitter
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from storage import import_json_table, read_table, write_table, seed_missing_social_media

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is missing. Add it to .env before starting the API.")

client = Groq(api_key=GROQ_API_KEY)
app = FastAPI(title="Sahel.ai RAG API")

limiter = Limiter(key_func=get_remote_address, default_limits=[os.getenv("RATE_LIMIT_DEFAULT", "30/minute")])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

RATE_LIMIT_AUTH = os.getenv("RATE_LIMIT_AUTH", "5/minute")
RATE_LIMIT_CHAT = os.getenv("RATE_LIMIT_CHAT", "20/minute")
RATE_LIMIT_WS = int(os.getenv("RATE_LIMIT_WS", "30"))

_ws_requests: dict[str, list[float]] = defaultdict(list)
_WS_WINDOW = 60.0
_WS_CLEANUP_INTERVAL = 300.0
_last_ws_cleanup = time.time()

def _check_ws_rate_limit(ip: str) -> bool:
    global _last_ws_cleanup
    now = time.time()
    if now - _last_ws_cleanup > _WS_CLEANUP_INTERVAL:
        cutoff = now - _WS_WINDOW
        stale = [k for k, v in _ws_requests.items() if not any(t > cutoff for t in v)]
        for k in stale:
            del _ws_requests[k]
        _last_ws_cleanup = now
    _ws_requests[ip] = [t for t in _ws_requests[ip] if now - t < _WS_WINDOW]
    if len(_ws_requests[ip]) >= RATE_LIMIT_WS:
        return False
    _ws_requests[ip].append(now)
    return True

origins = (
    os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin"],
)


@app.middleware("http")
async def _session_cookie_to_auth(request: Request, call_next):
    if "authorization" not in request.headers:
        token = request.cookies.get("session")
        if token:
            scope = dict(request.scope)
            scope["headers"] = [
                (k, v) for k, v in request.scope["headers"] if k != b"authorization"
            ] + [(b"authorization", f"Bearer {token}".encode())]
            request = Request(scope)
    return await call_next(request)


def _set_session_cookie(response: Response, token: str, expires_at: str) -> None:
    try:
        expires_dt = datetime.fromisoformat(expires_at)
        max_age = int((expires_dt - datetime.now(timezone.utc)).total_seconds())
    except (ValueError, TypeError):
        max_age = 86400
    response.set_cookie(
        key="session",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=max(max_age, 0),
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.set_cookie(
        key="session",
        value="",
        httponly=True,
        samesite="lax",
        max_age=0,
        path="/",
    )


@app.middleware("http")
async def _security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response


@app.middleware("http")
async def _csrf_protection(request: Request, call_next):
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        if not origin and not referer:
            return await call_next(request)
        allowed = False
        if origin:
            allowed = any(origin.rstrip("/") == o.rstrip("/") for o in origins)
        if not allowed and referer:
            allowed = any(
                referer.rstrip("/").startswith(o.rstrip("/"))
                for o in origins
            )
        if not allowed:
            raise HTTPException(status_code=403, detail="CSRF check failed.")
    return await call_next(request)


BASE_DIR = Path(__file__).resolve().parent
DATA_ROOT = Path(os.getenv("DATA_ROOT", str(BASE_DIR)))
VECTOR_STORE_ROOT = DATA_ROOT / "vector_stores"
UPLOAD_ROOT = DATA_ROOT / "uploaded_documents"
DATA_DIR = DATA_ROOT / "data"
BUSINESSES_FILE = DATA_DIR / "businesses.json"
MESSAGES_FILE = DATA_DIR / "messages.json"
INQUIRIES_FILE = DATA_DIR / "inquiries.json"
OWNERS_FILE = DATA_DIR / "owners.json"
DOCUMENTS_FILE = DATA_DIR / "documents.json"
CONVERSATIONS_FILE = DATA_DIR / "conversations.json"

TEMPLATES_DIR = BASE_DIR / "templates"
TEMPLATES_DIR.mkdir(exist_ok=True)
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)

for folder in (VECTOR_STORE_ROOT, UPLOAD_ROOT, DATA_DIR):
    folder.mkdir(exist_ok=True)

for table_name, json_path in {
    "owners": OWNERS_FILE,
    "businesses": BUSINESSES_FILE,
    "documents": DOCUMENTS_FILE,
    "conversations": CONVERSATIONS_FILE,
    "messages": MESSAGES_FILE,
    "inquiries": INQUIRIES_FILE,
}.items():
    import_json_table(table_name, json_path)

seed_missing_social_media(BUSINESSES_FILE)

embeddings = None

LANGUAGE_NAMES = {
    "ar": "Arabic",
    "fr": "French",
    "en": "English",
}

LANGUAGE_FALLBACKS = {
    "ar": "لا أتوفر على معلومات كافية في ملف هذا النشاط التجاري للإجابة بدقة. المرجو التواصل مباشرة مع صاحب النشاط.",
    "fr": "Je n'ai pas assez d'informations dans les documents de ce commerce pour répondre avec précision. Veuillez contacter directement le propriétaire.",
    "en": "I do not have enough information in this business's documents to answer accurately. Please contact the owner directly.",
}


def get_embeddings() -> HuggingFaceEmbeddings:
    global embeddings
    if embeddings is None:
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
    return embeddings


class BusinessCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    business_type: str = Field(default="commerce", max_length=50)
    description: str = Field(default="", max_length=500)
    owner_email: str | None = Field(default=None, max_length=120)
    owner_phone: str | None = Field(default=None, max_length=40)
    owner_id: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=100)
    working_hours: str | None = Field(default=None, max_length=100)
    primary_services: str | None = Field(default=None, max_length=500)
    address: str | None = Field(default=None, max_length=300)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    cover_image_url: str | None = Field(default=None, max_length=320)
    highlights: str | None = Field(default=None, max_length=2000)
    public_knowledge: str | None = Field(default=None, max_length=3000)
    ice: str | None = Field(default=None, max_length=20)
    rc: str | None = Field(default=None, max_length=30)
    if_tax: str | None = Field(default=None, max_length=30)
    patente: str | None = Field(default=None, max_length=30)
    cnss: str | None = Field(default=None, max_length=30)
    legal_form: str | None = Field(default=None, max_length=50)
    social_media: str | None = Field(default=None, max_length=2000)


class Business(BusinessCreate):
    id: str
    slug: str
    site_url: str
    chat_url: str


class BusinessUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    business_type: str = Field(default="commerce", max_length=50)
    description: str = Field(default="", max_length=500)
    owner_email: str | None = Field(default=None, max_length=120)
    owner_phone: str | None = Field(default=None, max_length=40)
    city: str | None = Field(default=None, max_length=100)
    working_hours: str | None = Field(default=None, max_length=100)
    primary_services: str | None = Field(default=None, max_length=500)
    address: str | None = Field(default=None, max_length=300)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    cover_image_url: str | None = Field(default=None, max_length=320)
    highlights: str | None = Field(default=None, max_length=2000)
    public_knowledge: str | None = Field(default=None, max_length=3000)
    ice: str | None = Field(default=None, max_length=20)
    rc: str | None = Field(default=None, max_length=30)
    if_tax: str | None = Field(default=None, max_length=30)
    patente: str | None = Field(default=None, max_length=30)
    cnss: str | None = Field(default=None, max_length=30)
    legal_form: str | None = Field(default=None, max_length=50)
    social_media: str | None = Field(default=None, max_length=2000)


class DocumentMetadata(BaseModel):
    id: str
    business_id: str
    file_name: str
    file_type: str
    file_url: str
    chunks: int = 0
    size_bytes: int = 0
    uploaded_at: str


class QueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    conversation_id: str | None = Field(default=None, max_length=80)


class OwnerRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=6, max_length=120)


class OwnerLogin(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=6, max_length=120)


class ForgotPassword(BaseModel):
    email: str = Field(min_length=5, max_length=120)


class ResetPassword(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    code: str = Field(min_length=8, max_length=8)
    new_password: str = Field(min_length=6, max_length=120)


class VerifyResetCode(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    code: str = Field(min_length=8, max_length=8)


class GoogleLogin(BaseModel):
    credential: str


class OwnerPublic(BaseModel):
    id: str
    full_name: str
    email: str
    created_at: str
    picture: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    current_password: str | None = None
    new_password: str | None = None
    profile_photo: str | None = None


class AuthResponse(BaseModel):
    owner: OwnerPublic
    token: str
    expires_at: str


class VerifyToken(BaseModel):
    token: str = Field(min_length=1)


class InquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    contact: str = Field(min_length=3, max_length=120)
    message: str = Field(min_length=2, max_length=1000)
    conversation_id: str | None = Field(default=None, max_length=80)


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=120)
    message: str = Field(min_length=2, max_length=2000)


class InquiryStatusUpdate(BaseModel):
    status: str = Field(pattern="^(new|contacted|closed)$")


class RetrievedDocument:
    def __init__(self, page_content: str, metadata: dict):
        self.page_content = page_content
        self.metadata = metadata


class LocalFaissStore:
    INDEX_FILE = "index.faiss"
    DOCSTORE_FILE = "docstore.json"

    def __init__(self, index, documents: list[dict], embedding_model: HuggingFaceEmbeddings):
        self.index = index
        self.documents = documents
        self.embedding_model = embedding_model

    @classmethod
    def from_texts(
        cls,
        texts: list[str],
        embedding_model: HuggingFaceEmbeddings,
        metadatas: list[dict],
    ) -> "LocalFaissStore":
        vectors = np.array(embedding_model.embed_documents(texts), dtype="float32")
        if vectors.ndim != 2 or vectors.shape[0] == 0:
            raise ValueError("Cannot build FAISS index without document vectors.")

        index = faiss.IndexFlatL2(vectors.shape[1])
        index.add(vectors)
        documents = [
            {"page_content": text, "metadata": metadata}
            for text, metadata in zip(texts, metadatas, strict=True)
        ]
        return cls(index=index, documents=documents, embedding_model=embedding_model)

    @classmethod
    def load_local(cls, store_path: Path, embedding_model: HuggingFaceEmbeddings) -> "LocalFaissStore":
        index_path = store_path / cls.INDEX_FILE
        docstore_path = store_path / cls.DOCSTORE_FILE
        if not index_path.exists() or not docstore_path.exists():
            raise HTTPException(
                status_code=404,
                detail="No documents indexed for this business yet. Upload a PDF first.",
            )

        index = faiss.read_index(str(index_path))
        documents = json.loads(docstore_path.read_text(encoding="utf-8"))
        return cls(index=index, documents=documents, embedding_model=embedding_model)

    def save_local(self, store_path: Path) -> None:
        store_path.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(store_path / self.INDEX_FILE))
        (store_path / self.DOCSTORE_FILE).write_text(
            json.dumps(self.documents, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def similarity_search(self, question: str, k: int = 3) -> list[RetrievedDocument]:
        if self.index.ntotal == 0:
            return []

        query_vector = np.array([self.embedding_model.embed_query(question)], dtype="float32")
        result_count = min(k, self.index.ntotal)
        _, indices = self.index.search(query_vector, result_count)
        results: list[RetrievedDocument] = []
        for index in indices[0]:
            if index < 0 or index >= len(self.documents):
                continue
            document = self.documents[int(index)]
            results.append(
                RetrievedDocument(
                    page_content=document["page_content"],
                    metadata=document.get("metadata") or {},
                )
            )
        return results


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"business-{uuid4().hex[:8]}"


def safe_id(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]", "", value)
    if not cleaned:
        raise HTTPException(status_code=400, detail="Invalid business id.")
    return cleaned


def read_json_file(path: Path) -> list[dict]:
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except UnicodeDecodeError:
        return json.loads(path.read_text(encoding="cp1252"))


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str, salt: str | None = None) -> str:
    current_salt = salt or uuid4().hex
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        current_salt.encode("utf-8"),
        600_000,
    ).hex()
    return f"{current_salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, expected_digest = stored_hash.split("$", 1)
    except ValueError:
        return False
    actual_digest = hash_password(password, salt).split("$", 1)[1]
    return hmac.compare_digest(actual_digest, expected_digest)


def auth_secret() -> str:
    secret = os.getenv("APP_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=500, detail="APP_SECRET_KEY is not configured.")
    return secret


def owner_session_ttl_minutes() -> int:
    try:
        return max(1, int(os.getenv("OWNER_SESSION_TTL_MINUTES", "1440")))
    except ValueError as exc:
        raise HTTPException(status_code=500, detail="OWNER_SESSION_TTL_MINUTES must be an integer.") from exc


def create_owner_session(owner_id: str) -> dict:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=owner_session_ttl_minutes())
    payload = {
        "sub": owner_id,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return {
        "token": jwt.encode(payload, auth_secret(), algorithm="HS256"),
        "expires_at": expires_at.isoformat(),
    }


def verify_owner_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, auth_secret(), algorithms=["HS256"])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Owner token has expired. Please log in again.") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid owner token.") from exc

    owner_id = payload.get("sub")
    if not isinstance(owner_id, str) or not owner_id:
        raise HTTPException(status_code=401, detail="Invalid owner token.")
    return ensure_owner(owner_id)


def require_owner(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Owner authentication is required.")
    return verify_owner_token(authorization.removeprefix("Bearer ").strip())


def default_owner() -> dict | None:
    demo_email = os.getenv("DEMO_OWNER_EMAIL")
    demo_password = os.getenv("DEMO_OWNER_PASSWORD")
    if not demo_email or not demo_password:
        return None
    return {
        "id": "demo-owner",
        "full_name": "Demo Owner",
        "email": demo_email,
        "password_hash": hash_password(demo_password),
        "verified": "true",
        "verification_token": None,
        "reset_code": None,
        "reset_code_expires": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def public_owner(owner: dict) -> dict:
    return {
        "id": owner["id"],
        "full_name": owner["full_name"],
        "email": owner["email"],
        "verified": "true" if owner.get("verified") in (None, "true", True) else "false",
        "created_at": owner["created_at"],
        "picture": owner.get("picture"),
    }


def owner_verified(owner: dict) -> bool:
    val = owner.get("verified")
    return val in (None, "true", True)


def generate_verification_token() -> str:
    return uuid4().hex + uuid4().hex


def send_verification_email(owner: dict) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    site_url = os.getenv("SITE_URL", "http://localhost:5173")
    token = owner.get("verification_token")
    if not token:
        return

    verify_url = f"{site_url}/verify-email?token={token}"

    subject = "Confirm your email — Sahel.ai"
    body = (
        f"Welcome to Sahel.ai, {owner['full_name']}!\n\n"
        f"Please confirm your email address by clicking the link below:\n\n"
        f"{verify_url}\n\n"
        f"This link expires in 24 hours.\n\n"
        f"If you didn't create an account, you can ignore this email.\n\n"
        f"Sahel.ai — Digital presence for Moroccan businesses"
    )

    if all([smtp_host, smtp_user, smtp_pass]):
        try:
            msg = MIMEText(body, _charset="utf-8")
            msg["Subject"] = subject
            msg["From"] = smtp_user
            msg["To"] = owner["email"]
            with smtplib.SMTP(smtp_host, int(smtp_port), timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            return
        except Exception as e:
            logging.error("SMTP send_verification_email failed: %s", e)

    logging.warning("\n=== VERIFICATION EMAIL (SMTP not configured) ===")
    logging.warning("To: %s", owner['email'])
    logging.warning("==================================================\n")


def send_reset_code_email(owner: dict, code: str) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    subject = "Password reset code — Sahel.ai"
    body = (
        f"Hello {owner['full_name']},\n\n"
        f"Use the code below to reset your Sahel.ai password:\n\n"
        f"{code}\n\n"
        f"This code expires in 15 minutes.\n\n"
        f"If you didn't request this, you can ignore this email.\n\n"
        f"Sahel.ai — Digital presence for Moroccan businesses"
    )

    if all([smtp_host, smtp_user, smtp_pass]):
        try:
            msg = MIMEText(body, _charset="utf-8")
            msg["Subject"] = subject
            msg["From"] = smtp_user
            msg["To"] = owner["email"]
            with smtplib.SMTP(smtp_host, int(smtp_port), timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            return
        except Exception as e:
            logging.error("SMTP send_reset_code failed: %s", e)

    logging.warning("\n=== RESET CODE (SMTP not configured) ===")
    logging.warning("To: %s", owner['email'])
    logging.warning("==========================================\n")


def read_owners() -> list[dict]:
    owners = read_table("owners")
    if owners:
        return owners
    demo = default_owner()
    if demo:
        owners = [demo]
        write_owners(owners)
    return owners


def write_owners(owners: list[dict]) -> None:
    write_table("owners", owners)


def find_owner(owner_id: str) -> dict | None:
    return next((owner for owner in read_owners() if owner["id"] == owner_id), None)


def find_owner_by_email(email: str) -> dict | None:
    normalized = normalize_email(email)
    return next((owner for owner in read_owners() if owner["email"] == normalized), None)


def read_documents() -> list[dict]:
    return read_table("documents")


def write_documents(documents: list[dict]) -> None:
    write_table("documents", documents)


def read_conversations() -> list[dict]:
    return read_table("conversations")


def write_conversations(conversations: list[dict]) -> None:
    write_table("conversations", conversations)


def ensure_owner(owner_id: str) -> dict:
    owner = find_owner(owner_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found.")
    return owner


BUSINESS_OPTIONAL_DEFAULTS = {
    "owner_phone": None,
    "city": None,
    "working_hours": None,
    "primary_services": None,
    "address": None,
    "latitude": None,
    "longitude": None,
    "cover_image_url": None,
    "highlights": None,
    "public_knowledge": None,
    "ice": None,
    "rc": None,
    "if_tax": None,
    "patente": None,
    "cnss": None,
    "legal_form": None,
    "social_media": None,
}

COVER_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def normalize_business_record(business: dict) -> dict:
    for key, default in BUSINESS_OPTIONAL_DEFAULTS.items():
        if key not in business:
            business[key] = default
    for coord in ("latitude", "longitude"):
        value = business.get(coord)
        if value is not None and value != "":
            try:
                business[coord] = float(value)
            except (TypeError, ValueError):
                business[coord] = None
        else:
            business[coord] = None
    return business


def business_profile_fields(payload: BusinessCreate | BusinessUpdate) -> dict:
    return {
        "name": payload.name,
        "business_type": payload.business_type,
        "description": payload.description,
        "owner_email": payload.owner_email,
        "owner_phone": payload.owner_phone,
        "city": payload.city,
        "working_hours": payload.working_hours,
        "primary_services": payload.primary_services,
        "address": payload.address,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "cover_image_url": payload.cover_image_url,
        "highlights": payload.highlights,
        "public_knowledge": payload.public_knowledge,
        "ice": payload.ice,
        "rc": payload.rc,
        "if_tax": payload.if_tax,
        "patente": payload.patente,
        "cnss": payload.cnss,
        "legal_form": payload.legal_form,
        "social_media": payload.social_media,
    }


def read_businesses() -> list[dict]:
    businesses = read_table("businesses")
    changed = False
    for business in businesses:
        if not business.get("owner_id"):
            business["owner_id"] = "demo-owner"
            changed = True
        before = dict(business)
        normalize_business_record(business)
        if before != business:
            changed = True
    if changed:
        read_owners()
        write_businesses(businesses)
    return businesses


def write_businesses(businesses: list[dict]) -> None:
    write_table("businesses", businesses)


def read_messages() -> list[dict]:
    messages = read_table("messages")
    changed = False
    for message in messages:
        if not message.get("language"):
            message["language"] = detect_language(message.get("question", ""))
            changed = True
    if changed:
        write_messages(messages)
    return messages


def write_messages(messages: list[dict]) -> None:
    write_table("messages", messages)


def read_inquiries() -> list[dict]:
    inquiries = read_table("inquiries")
    changed = False
    for inquiry in inquiries:
        if not inquiry.get("status"):
            inquiry["status"] = "new"
            changed = True
    if changed:
        write_inquiries(inquiries)
    return inquiries


def write_inquiries(inquiries: list[dict]) -> None:
    write_table("inquiries", inquiries)


def read_contacts() -> list[dict]:
    return read_table("contacts")


def write_contacts(contacts: list[dict]) -> None:
    write_table("contacts", contacts)


def send_contact_email(contact: dict) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    notify_to = os.getenv("NOTIFICATION_EMAIL")

    if not notify_to:
        return

    if not all([smtp_host, smtp_user, smtp_pass, notify_to]):
        return

    subject = f"New contact from {contact['name']} — Sahel.ai"
    body = (
        f"New contact message received!\n\n"
        f"Name: {contact['name']}\n"
        f"Email: {contact['email']}\n"
        f"Message: {contact['message']}\n\n"
        f"Sahel.ai — Digital presence for Moroccan businesses"
    )

    try:
        msg = MIMEText(body, _charset="utf-8")
        msg["Subject"] = subject
        msg["From"] = smtp_user
        msg["To"] = notify_to
        with smtplib.SMTP(smtp_host, int(smtp_port), timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logging.info("Contact notification sent to %s", notify_to)
    except Exception as e:
        logging.error("Failed to send contact notification: %s", e)


def save_contact(payload: ContactCreate) -> dict:
    contact = {
        "id": uuid4().hex[:12],
        "name": payload.name.strip(),
        "email": payload.email.strip().lower(),
        "message": payload.message.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    contacts = read_contacts()
    contacts.append(contact)
    write_contacts(contacts)
    try:
        send_contact_email(contact)
    except Exception as e:
        logging.error("send_contact_email failed: %s", e)
    return contact


def normalize_language_text(value: str) -> str:
    return "".join(
        char
        for char in unicodedata.normalize("NFKD", value.lower())
        if not unicodedata.combining(char)
    )


def keyword_score(text: str, keywords: set[str]) -> int:
    searchable_text = " " + re.sub(r"[^a-z0-9'-]+", " ", text) + " "
    return sum(1 for keyword in keywords if f" {keyword} " in searchable_text)


def detect_language(text: str) -> str:
    if re.search(r"[\u0600-\u06FF]", text):
        return "ar"

    normalized_text = normalize_language_text(text)
    french_keywords = {
        "bonjour",
        "salut",
        "merci",
        "reservation",
        "reserver",
        "rendez-vous",
        "disponibilite",
        "dispo",
        "devis",
        "prix",
        "svp",
        "je",
        "vous",
        "nous",
        "est-ce",
        "s'il",
        "ouvert",
        "ferme",
        "adresse",
        "telephone",
        "contact",
        "livraison",
        "menu",
        "chambre",
        "pharmacie",
        "clinique",
        "combien",
        "horaires",
    }
    english_keywords = {
        "hello",
        "hi",
        "thanks",
        "thank",
        "booking",
        "availability",
        "quote",
        "price",
        "please",
        "what",
        "when",
        "where",
        "can",
        "open",
        "closed",
        "address",
        "phone",
        "contact",
        "delivery",
        "menu",
        "room",
        "clinic",
        "how",
    }
    arabic_latin_keywords = {
        "salam",
        "salaam",
        "salamou",
        "chhal",
        "bchhal",
        "wach",
        "wash",
        "fin",
        "fayn",
        "kayen",
        "kayn",
        "bghit",
        "bghina",
        "nheb",
        "shukran",
        "chokran",
        "marhba",
        "had",
        "hadou",
        "dyal",
        "dial",
        "dyali",
        "dyalna",
        "chnu",
        "chnou",
        "chno",
        "ach",
        "ash",
        "ana",
        "hna",
        "mzyan",
        "mzian",
        "bzf",
        "bezzaf",
        "smiya",
        "chi",
        "bla",
        "bhal",
        "nta",
        "nti",
        "ntuma",
        "wah",
        "gal",
        "lgal",
        "drari",
        "tnak",
        "temma",
    }
    if keyword_score(normalized_text, arabic_latin_keywords) > 0:
        return "ar"

    french_score = keyword_score(normalized_text, french_keywords)
    english_score = keyword_score(normalized_text, english_keywords)

    if re.search(r"[àâçéèêëîïôùûüÿœ]", text.lower()):
        french_score += 1

    if french_score > english_score:
        return "fr"
    if english_score > french_score:
        return "en"
    return "en"


def language_instruction(language: str) -> str:
    language_name = LANGUAGE_NAMES.get(language, LANGUAGE_NAMES["en"])
    fallback = LANGUAGE_FALLBACKS.get(language, LANGUAGE_FALLBACKS["en"])
    return (
        f"The visitor language is {language_name}. Answer entirely in {language_name}. "
        "Do not switch language unless the visitor explicitly asks you to translate. "
        "For Moroccan Arabic/Darija, answer in clear Arabic script. "
        "If the profile and retrieved document context do not contain the answer, "
        f"use this fallback message exactly: {fallback}"
    )


def save_chat_message(
    business_id: str,
    question: str,
    answer: str,
    sources: list[str],
    conversation_id: str | None,
    language: str,
    visitor_ip: str | None,
) -> str:
    current_conversation_id = conversation_id or uuid4().hex[:12]
    conversations = read_conversations()
    if not any(conversation["id"] == current_conversation_id for conversation in conversations):
        conversations.append(
            {
                "id": current_conversation_id,
                "business_id": business_id,
                "language": language,
                "visitor_ip": visitor_ip,
                "started_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        write_conversations(conversations)

    messages = read_messages()
    messages.append(
        {
            "id": uuid4().hex[:12],
            "business_id": business_id,
            "conversation_id": current_conversation_id,
            "question": question,
            "answer": answer,
            "sources": sources,
            "language": language,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    write_messages(messages)
    return current_conversation_id


def send_notification_email(business: dict, inquiry: dict) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    notify_to = os.getenv("NOTIFICATION_EMAIL") or business.get("owner_email")

    if not all([smtp_host, smtp_user, smtp_pass, notify_to]):
        return

    subject = f"New inquiry for {business['name']} — Sahel.ai"
    body = (
        f"New inquiry received for {business['name']}!\n\n"
        f"Name: {inquiry['name']}\n"
        f"Contact: {inquiry['contact']}\n"
        f"Message: {inquiry['message']}\n\n"
        f"View all inquiries: {os.getenv('SITE_URL', 'https://sahel.ai')}/#/dashboard\n\n"
        f"Sahel.ai — Digital presence for Moroccan businesses"
    )

    try:
        msg = MIMEText(body, _charset="utf-8")
        msg["Subject"] = subject
        msg["From"] = smtp_user
        msg["To"] = notify_to

        with smtplib.SMTP(smtp_host, int(smtp_port), timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logging.info("Inquiry notification sent to %s", notify_to)
    except Exception as e:
        logging.error("Failed to send inquiry notification: %s", e)


def save_inquiry(business: dict, payload: InquiryCreate) -> dict:
    inquiry = {
        "id": uuid4().hex[:12],
        "business_id": business["id"],
        "name": payload.name.strip(),
        "contact": payload.contact.strip(),
        "message": payload.message.strip(),
        "conversation_id": payload.conversation_id,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    inquiries = read_inquiries()
    inquiries.append(inquiry)
    write_inquiries(inquiries)
    try:
        send_notification_email(business, inquiry)
    except Exception as e:
        logging.error("send_notification_email failed: %s", e)
    return inquiry


def find_business(identifier: str) -> dict | None:
    return next(
        (
            business
            for business in read_businesses()
            if business["id"] == identifier or business["slug"] == identifier
        ),
        None,
    )


def ensure_owner_business(identifier: str, owner: dict) -> dict:
    business = find_business(identifier)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")
    if business.get("owner_id") != owner["id"]:
        raise HTTPException(status_code=403, detail="This business belongs to another owner.")
    return business


def unique_slug(name: str) -> str:
    base_slug = slugify(name)
    existing = {business["slug"] for business in read_businesses()}
    slug = base_slug
    counter = 2
    while slug in existing:
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


def business_store_path(business_id: str) -> Path:
    return VECTOR_STORE_ROOT / safe_id(business_id)


def business_upload_path(business_id: str) -> Path:
    path = UPLOAD_ROOT / safe_id(business_id)
    path.mkdir(exist_ok=True)
    return path


def document_file_path(document: dict) -> Path:
    return business_upload_path(document["business_id"]) / Path(document["file_name"]).name


def process_document(file_path: Path) -> List[str]:
    try:
        if file_path.suffix.lower() == ".txt":
            try:
                document_text = file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                document_text = file_path.read_text(encoding="cp1252")
        elif file_path.suffix.lower() == ".pdf":
            reader = PdfReader(str(file_path))
            document_text = "\n\n".join(
                page.extract_text() or ""
                for page in reader.pages
            )
        else:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")

        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        texts = text_splitter.split_text(document_text)
        return [text.strip() for text in texts if text.strip()]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error processing document: {exc}") from exc


def load_store(business_id: str) -> LocalFaissStore:
    store_path = business_store_path(business_id)
    if not store_path.exists():
        raise HTTPException(
            status_code=404,
            detail="No documents indexed for this business yet. Upload a PDF first.",
        )
    return LocalFaissStore.load_local(store_path, get_embeddings())


def sync_documents_from_uploads() -> list[dict]:
    documents = read_documents()
    known_files = {
        (document["business_id"], document["file_name"])
        for document in documents
    }
    changed = False

    for business in read_businesses():
        upload_path = business_upload_path(business["id"])
        for ext in ("*.pdf", "*.txt"):
            for file_path in upload_path.glob(ext):
                key = (business["id"], file_path.name)
                if key in known_files:
                    continue
                file_type = "text/plain" if file_path.suffix.lower() == ".txt" else "application/pdf"
                documents.append(
                    {
                        "id": uuid4().hex[:12],
                        "business_id": business["id"],
                        "file_name": file_path.name,
                        "file_type": file_type,
                        "file_url": f"/uploaded_documents/{business['id']}/{file_path.name}",
                        "chunks": 0,
                        "size_bytes": file_path.stat().st_size,
                        "uploaded_at": datetime.fromtimestamp(
                            file_path.stat().st_mtime,
                            timezone.utc,
                        ).isoformat(),
                    }
                )
                changed = True

    if changed:
        write_documents(documents)
    return documents


def documents_for_business(business_id: str) -> list[dict]:
    documents = [
        document
        for document in sync_documents_from_uploads()
        if document["business_id"] == business_id
    ]
    return sorted(documents, key=lambda item: item["uploaded_at"], reverse=True)


def upsert_document_metadata(business_id: str, file_path: Path, chunks: int, original_name: str | None = None) -> dict:
    documents = sync_documents_from_uploads()
    file_name = file_path.name
    existing = next(
        (
            document
            for document in documents
            if document["business_id"] == business_id and document["file_name"] == file_name
        ),
        None,
    )
    file_type = "text/plain" if file_path.suffix.lower() == ".txt" else "application/pdf"
    metadata = {
        "id": existing["id"] if existing else uuid4().hex[:12],
        "business_id": business_id,
        "file_name": file_name,
        "original_name": original_name or file_name,
        "file_type": file_type,
        "file_url": f"/uploaded_documents/{business_id}/{file_name}",
        "chunks": chunks,
        "size_bytes": file_path.stat().st_size,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }

    if existing:
        existing.update(metadata)
    else:
        documents.append(metadata)

    write_documents(documents)
    return metadata


def remove_business_store(business_id: str) -> None:
    store_path = business_store_path(business_id).resolve()
    root_path = VECTOR_STORE_ROOT.resolve()
    if store_path.exists() and root_path in store_path.parents:
        shutil.rmtree(store_path)


def rebuild_business_store(business_id: str) -> int:
    documents = documents_for_business(business_id)
    all_texts: list[str] = []
    all_metadata: list[dict] = []
    changed = False

    for document in documents:
        file_path = document_file_path(document)
        if not file_path.exists():
            continue
        texts = process_document(file_path)
        all_texts.extend(texts)
        all_metadata.extend(
            [{"source": document["file_name"], "document_id": document["id"]}] * len(texts)
        )
        if document.get("chunks") != len(texts):
            document["chunks"] = len(texts)
            changed = True

    if changed:
        existing_documents = read_documents()
        chunk_counts = {document["id"]: document["chunks"] for document in documents}
        for document in existing_documents:
            if document["id"] in chunk_counts:
                document["chunks"] = chunk_counts[document["id"]]
        write_documents(existing_documents)

    remove_business_store(business_id)
    if not all_texts:
        return 0

    store_path = business_store_path(business_id)
    store = LocalFaissStore.from_texts(all_texts, get_embeddings(), all_metadata)
    store.save_local(store_path)
    return len(all_texts)


def answer_for_business(business: dict, question: str, language: str | None = None) -> dict:
    detected_language = language or detect_language(question)
    relevant_docs = []
    try:
        store = load_store(business["id"])
        relevant_docs = store.similarity_search(question, k=3)
    except HTTPException as exc:
        if exc.status_code != 404:
            raise
        if documents_for_business(business["id"]):
            try:
                rebuild_business_store(business["id"])
                store = load_store(business["id"])
                relevant_docs = store.similarity_search(question, k=3)
            except HTTPException:
                pass

    context = "\n".join(doc.page_content for doc in relevant_docs)
    owner_email = business.get("owner_email") or "Not provided"
    owner_phone = business.get("owner_phone") or "Not provided"

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are the multilingual assistant for this Moroccan business. "
                    "Answer only from the provided business profile and document context. "
                    "Never invent prices, opening hours, availability, medical advice, "
                    "legal advice, or policies that are not present in the context. "
                    f"{language_instruction(detected_language)}"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Business name: {business['name']}\n"
                    f"Business type: {business['business_type']}\n"
                    f"Business description: {business.get('description', '')}\n"
                    f"City: {business.get('city', 'Not specified')}\n"
                    f"Working hours: {business.get('working_hours', 'Not specified')}\n"
                    f"Services: {business.get('primary_services', 'Not specified')}\n"
                    f"Highlights: {business.get('highlights', 'Not specified')}\n"
                    f"General knowledge: {business.get('public_knowledge', 'Not specified')}\n\n"
                    f"Owner email: {owner_email}\n"
                    f"Owner phone: {owner_phone}\n\n"
                    f"Question: {question}\n\n"
                    f"Document context:\n{context or 'No uploaded document context available.'}"
                ),
            },
        ],
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": [doc.metadata.get("source", "Unknown") for doc in relevant_docs],
    }


async def stream_answer_for_business(business: dict, question: str, language: str | None = None):
    detected_language = language or detect_language(question)
    relevant_docs = []
    try:
        store = load_store(business["id"])
        relevant_docs = store.similarity_search(question, k=3)
    except HTTPException as exc:
        if exc.status_code != 404:
            raise
        if documents_for_business(business["id"]):
            try:
                rebuild_business_store(business["id"])
                store = load_store(business["id"])
                relevant_docs = store.similarity_search(question, k=3)
            except HTTPException:
                pass

    context = "\n".join(doc.page_content for doc in relevant_docs)
    owner_email = business.get("owner_email") or "Not provided"
    owner_phone = business.get("owner_phone") or "Not provided"

    messages = [
        {
            "role": "system",
            "content": (
                "You are the multilingual assistant for this Moroccan business. "
                "Answer only from the provided business profile and document context. "
                "Never invent prices, opening hours, availability, medical advice, "
                "legal advice, or policies that are not present in the context. "
                f"{language_instruction(detected_language)}"
            ),
        },
        {
            "role": "user",
            "content": (
                f"Business name: {business['name']}\n"
                f"Business type: {business['business_type']}\n"
                f"Business description: {business.get('description', '')}\n"
                f"City: {business.get('city', 'Not specified')}\n"
                f"Working hours: {business.get('working_hours', 'Not specified')}\n"
                f"Services: {business.get('primary_services', 'Not specified')}\n"
                f"Highlights: {business.get('highlights', 'Not specified')}\n"
                f"General knowledge: {business.get('public_knowledge', 'Not specified')}\n\n"
                f"Owner email: {owner_email}\n"
                f"Owner phone: {owner_phone}\n\n"
                f"Question: {question}\n\n"
                f"Document context:\n{context or 'No uploaded document context available.'}"
            ),
        },
    ]

    loop = asyncio.get_event_loop()
    stream = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            stream=True,
            messages=messages,
        ),
    )
    for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token


async def stream_llm_only(business: dict, question: str, language: str | None = None):
    detected_language = language or detect_language(question)
    owner_email = business.get("owner_email") or "Not provided"
    owner_phone = business.get("owner_phone") or "Not provided"

    messages = [
        {
            "role": "system",
            "content": (
                "You are the multilingual assistant for this Moroccan business. "
                "Answer based on the business profile below. "
                "If you do not know the answer, say so honestly. "
                "Never invent prices, opening hours, or other details. "
                f"{language_instruction(detected_language)}"
            ),
        },
        {
            "role": "user",
            "content": (
                f"Business name: {business['name']}\n"
                f"Business type: {business['business_type']}\n"
                f"Business description: {business.get('description', '')}\n"
                f"City: {business.get('city', 'Not specified')}\n"
                f"Working hours: {business.get('working_hours', 'Not specified')}\n"
                f"Services: {business.get('primary_services', 'Not specified')}\n"
                f"Highlights: {business.get('highlights', 'Not specified')}\n"
                f"General knowledge: {business.get('public_knowledge', 'Not specified')}\n\n"
                f"Owner email: {owner_email}\n"
                f"Owner phone: {owner_phone}\n\n"
                f"Question: {question}"
            ),
        },
    ]

    loop = asyncio.get_event_loop()
    stream = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            stream=True,
            messages=messages,
        ),
    )
    for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token


def analytics_for_business(business_id: str) -> dict:
    messages = [message for message in read_messages() if message["business_id"] == business_id]
    conversations = {message["conversation_id"] for message in messages}
    conversation_languages: dict[str, str] = {}
    question_counts: dict[str, int] = {}

    for message in messages:
        conversation_languages.setdefault(
            message["conversation_id"],
            message.get("language") or detect_language(message.get("question", "")),
        )
        question = message["question"].strip()
        question_counts[question] = question_counts.get(question, 0) + 1

    language_counts = {"ar": 0, "fr": 0, "en": 0, "unknown": 0}
    for language in conversation_languages.values():
        if language in language_counts:
            language_counts[language] += 1
        else:
            language_counts["unknown"] += 1

    top_questions = [
        {"question": question, "count": count}
        for question, count in sorted(question_counts.items(), key=lambda item: item[1], reverse=True)[:5]
    ]

    return {
        "total_messages": len(messages),
        "total_conversations": len(conversations),
        "language_counts": language_counts,
        "top_questions": top_questions,
        "recent_messages": list(reversed(messages[-8:])),
    }


def inquiries_for_business(business_id: str) -> list[dict]:
    inquiries = [inquiry for inquiry in read_inquiries() if inquiry["business_id"] == business_id]
    return list(reversed(inquiries[-20:]))


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/owners/register")
@limiter.limit(RATE_LIMIT_AUTH)
async def register_owner(request: Request, payload: OwnerRegister):
    owners = read_owners()
    email = normalize_email(payload.email)
    if any(owner["email"] == email for owner in owners):
        raise HTTPException(status_code=409, detail="An owner with this email already exists.")

    verification_token = generate_verification_token()
    owner = {
        "id": uuid4().hex[:12],
        "full_name": payload.full_name.strip(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "verified": "false",
        "verification_token": verification_token,
        "reset_code": None,
        "reset_code_expires": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    owners.append(owner)
    write_owners(owners)
    send_verification_email(owner)
    return {
        "message": "Registration successful. Please check your email to verify your account.",
        "owner_id": owner["id"],
    }


@app.post("/owners/verify", response_model=AuthResponse)
@limiter.limit(RATE_LIMIT_AUTH)
async def verify_owner_email(request: Request, payload: VerifyToken, response: Response):
    owners = read_owners()
    owner = next((o for o in owners if o.get("verification_token") == payload.token), None)
    if not owner:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")

    owner["verified"] = "true"
    owner["verification_token"] = None
    write_owners(owners)
    session = create_owner_session(owner["id"])
    _set_session_cookie(response, session["token"], session["expires_at"])
    return {"owner": public_owner(owner), **session}


@app.post("/owners/resend-verification")
@limiter.limit(RATE_LIMIT_AUTH)
async def resend_verification(request: Request, payload: ForgotPassword):
    owner = find_owner_by_email(payload.email)
    if not owner:
        raise HTTPException(status_code=404, detail="No account found with this email.")
    if owner_verified(owner):
        raise HTTPException(status_code=400, detail="This account is already verified.")

    owner["verification_token"] = generate_verification_token()
    owners = read_owners()
    for i, o in enumerate(owners):
        if o["id"] == owner["id"]:
            owners[i] = owner
            break
    write_owners(owners)
    send_verification_email(owner)
    return {"message": "Verification email resent. Please check your inbox."}


@app.post("/owners/forgot-password")
@limiter.limit(RATE_LIMIT_AUTH)
async def forgot_password(request: Request, payload: ForgotPassword):
    owner = find_owner_by_email(payload.email)
    if not owner:
        return {"message": "If that email exists, a reset code has been sent."}

    code = secrets.token_urlsafe(6)[:8]
    owner["reset_code"] = code
    owner["reset_code_expires"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()

    owners = read_owners()
    for i, o in enumerate(owners):
        if o["id"] == owner["id"]:
            owners[i] = owner
            break
    write_owners(owners)
    send_reset_code_email(owner, code)
    return {"message": "If that email exists, a reset code has been sent."}


@app.post("/owners/verify-reset-code")
@limiter.limit(RATE_LIMIT_AUTH)
async def verify_reset_code(request: Request, payload: VerifyResetCode):
    owner = find_owner_by_email(payload.email)
    if not owner:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    if owner.get("reset_code") != payload.code:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    expires = owner.get("reset_code_expires")
    if expires:
        try:
            expires_dt = datetime.fromisoformat(expires)
            if expires_dt.tzinfo is None:
                expires_dt = expires_dt.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expires_dt:
                raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    return {"valid": True}


@app.post("/owners/reset-password")
@limiter.limit(RATE_LIMIT_AUTH)
async def reset_password(request: Request, payload: ResetPassword):
    owner = find_owner_by_email(payload.email)
    if not owner:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    if owner.get("reset_code") != payload.code:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    expires = owner.get("reset_code_expires")
    if not expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    try:
        expires_dt = datetime.fromisoformat(expires)
        if expires_dt.tzinfo is None:
            expires_dt = expires_dt.replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    if datetime.now(timezone.utc) > expires_dt:
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    owner["password_hash"] = hash_password(payload.new_password)
    owner["reset_code"] = None
    owner["reset_code_expires"] = None

    owners = read_owners()
    for i, o in enumerate(owners):
        if o["id"] == owner["id"]:
            owners[i] = owner
            break
    write_owners(owners)
    return {"message": "Password has been reset successfully."}


@app.post("/owners/login", response_model=AuthResponse)
@limiter.limit(RATE_LIMIT_AUTH)
async def login_owner(request: Request, payload: OwnerLogin, response: Response):
    owner = find_owner_by_email(payload.email)
    if not owner or not verify_password(payload.password, owner.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not owner_verified(owner):
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in. Check your inbox or request a new verification link.",
        )
    session = create_owner_session(owner["id"])
    _set_session_cookie(response, session["token"], session["expires_at"])
    return {"owner": public_owner(owner), **session}


@app.post("/owners/google-login", response_model=AuthResponse)
@limiter.limit(RATE_LIMIT_AUTH)
async def google_login(request: Request, payload: GoogleLogin, response: Response):
    import httpx
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID not configured.")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": payload.credential},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token.")
            info = resp.json()
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Failed to verify Google token.")

    if info.get("aud") != client_id:
        raise HTTPException(status_code=401, detail="Google token audience mismatch.")

    email = normalize_email(info.get("email", ""))
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email.")

    name = info.get("name", "").strip() or email.split("@")[0]
    owners = read_owners()
    owner = find_owner_by_email(email)

    if not owner:
        owner = {
            "id": uuid4().hex[:12],
            "full_name": name,
            "email": email,
            "password_hash": "",
            "verified": "true",
            "verification_token": None,
            "reset_code": None,
            "reset_code_expires": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        owners.append(owner)
        write_owners(owners)
    elif not owner_verified(owner):
        owner["verified"] = "true"
        owner["verification_token"] = None
        for i, o in enumerate(owners):
            if o["id"] == owner["id"]:
                owners[i] = owner
                break
        write_owners(owners)

    session = create_owner_session(owner["id"])
    _set_session_cookie(response, session["token"], session["expires_at"])
    return {"owner": public_owner(owner), **session}


@app.post("/owners/logout")
async def logout_owner(response: Response):
    _clear_session_cookie(response)
    return {"message": "Logged out."}


@app.get("/owners/{owner_id}", response_model=OwnerPublic)
async def get_owner(owner_id: str, authorization: str | None = Header(default=None)):
    owner = require_owner(authorization)
    if owner["id"] != owner_id:
        raise HTTPException(status_code=403, detail="You can only access your own owner profile.")
    return public_owner(owner)


PROFILE_PHOTOS_DIR = DATA_ROOT / "profile_photos"
PROFILE_PHOTOS_DIR.mkdir(exist_ok=True)


@app.put("/owners/profile")
async def update_owner_profile(payload: ProfileUpdate, authorization: str | None = Header(default=None)):
    owner = require_owner(authorization)
    owners = read_owners()
    idx = next((i for i, o in enumerate(owners) if o["id"] == owner["id"]), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Owner not found")

    if payload.full_name is not None:
        owner["full_name"] = payload.full_name
    if payload.email is not None:
        owner["email"] = normalize_email(payload.email)
    if payload.new_password:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to change password.")
        if not verify_password(payload.current_password, owner["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if len(payload.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        owner["password_hash"] = hash_password(payload.new_password)
    if payload.profile_photo:
        try:
            header, encoded = payload.profile_photo.split(",", 1)
            ext = "png"
            if "jpeg" in header or "jpg" in header:
                ext = "jpg"
            elif "webp" in header:
                ext = "webp"
            elif "gif" in header:
                ext = "gif"
            photo_data = base64.b64decode(encoded)
            photo_path = PROFILE_PHOTOS_DIR / f"{owner['id']}.{ext}"
            with open(photo_path, "wb") as f:
                f.write(photo_data)
            owner["picture"] = f"/profile_photos/{owner['id']}.{ext}"
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid profile photo data")

    owners[idx] = owner
    write_owners(owners)
    return {"owner": public_owner(owner)}


@app.get("/businesses")
async def list_businesses(owner_id: str | None = None, authorization: str | None = Header(default=None)):
    businesses = read_businesses()
    if owner_id:
        owner = require_owner(authorization)
        if owner["id"] != owner_id:
            raise HTTPException(status_code=403, detail="You can only list your own businesses.")
        businesses = [business for business in businesses if business.get("owner_id") == owner_id]
    return {"businesses": businesses}


@app.post("/businesses", response_model=Business)
async def create_business(payload: BusinessCreate, authorization: str | None = Header(default=None)):
    owner = require_owner(authorization)
    businesses = read_businesses()
    business_id = uuid4().hex[:12]
    slug = unique_slug(payload.name)
    business = {
        "id": business_id,
        "owner_id": owner["id"],
        "slug": slug,
        **business_profile_fields(payload),
        "site_url": f"/b/{slug}",
        "chat_url": f"/chat/{slug}",
    }
    normalize_business_record(business)
    businesses.append(business)
    write_businesses(businesses)
    return {**BUSINESS_OPTIONAL_DEFAULTS, **business}


@app.put("/businesses/{identifier}", response_model=Business)
async def update_business(identifier: str, payload: BusinessUpdate, authorization: str | None = Header(default=None)):
    owner = require_owner(authorization)
    businesses = read_businesses()
    business = next(
        (
            item
            for item in businesses
            if item["id"] == identifier or item["slug"] == identifier
        ),
        None,
    )
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")
    if business.get("owner_id") != owner["id"]:
        raise HTTPException(status_code=403, detail="This business belongs to another owner.")

    business.update(business_profile_fields(payload))
    normalize_business_record(business)
    write_businesses(businesses)
    return business


@app.delete("/businesses/{identifier}")
async def delete_business(identifier: str, authorization: str | None = Header(default=None)):
    owner = require_owner(authorization)
    businesses = read_businesses()
    business = next((item for item in businesses if item["id"] == identifier or item["slug"] == identifier), None)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")
    if business.get("owner_id") != owner["id"]:
        raise HTTPException(status_code=403, detail="This business belongs to another owner.")
    write_businesses([item for item in businesses if item["id"] != business["id"]])
    return {"message": "Business deleted.", "id": business["id"]}


@app.post("/businesses/{identifier}/cover", response_model=Business)
async def upload_business_cover(
    identifier: str,
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
):
    owner = require_owner(authorization)
    business = ensure_owner_business(identifier, owner)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing cover image file.")

    extension = Path(file.filename).suffix.lower()
    if extension not in COVER_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and WEBP images are supported.")

    upload_path = business_upload_path(business["id"])
    for old_cover in upload_path.glob("cover.*"):
        if old_cover.is_file():
            old_cover.unlink()

    cover_name = f"cover{extension}"
    cover_path = upload_path / cover_name
    try:
        with cover_path.open("wb") as saved_file:
            shutil.copyfileobj(file.file, saved_file)
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Could not save cover image: {exc}") from exc

    cover_url = f"/uploaded_documents/{business['id']}/{cover_name}"
    businesses = read_businesses()
    updated = None
    for item in businesses:
        if item["id"] == business["id"]:
            item["cover_image_url"] = cover_url
            normalize_business_record(item)
            updated = item
            break
    if not updated:
        raise HTTPException(status_code=404, detail="Business not found.")
    write_businesses(businesses)
    return updated


@app.get("/businesses/{identifier}", response_model=Business)
async def get_business(identifier: str):
    business = find_business(identifier)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")
    normalize_business_record(business)
    return business


@app.get("/businesses/{identifier}/analytics")
async def get_business_analytics(identifier: str, authorization: str | None = Header(default=None)):
    owner = require_owner(authorization)
    business = ensure_owner_business(identifier, owner)
    return analytics_for_business(business["id"])


@app.get("/owner/analytics")
async def get_owner_analytics(authorization: str | None = Header(default=None)):
    owner = require_owner(authorization)
    owner_businesses = [b for b in read_businesses() if b.get("owner_id") == owner["id"]]
    owner_business_ids = {b["id"] for b in owner_businesses}
    business_names = {b["id"]: b["name"] for b in owner_businesses}

    all_messages = [m for m in read_messages() if m["business_id"] in owner_business_ids]

    messages_by_business = {}
    for msg in all_messages:
        messages_by_business.setdefault(msg["business_id"], []).append(msg)

    total_messages = len(all_messages)
    total_conversations = len({m["conversation_id"] for m in all_messages})

    conversation_languages = {}
    for msg in all_messages:
        conversation_languages.setdefault(
            msg["conversation_id"],
            msg.get("language") or detect_language(msg.get("question", "")),
        )

    language_counts = {"ar": 0, "fr": 0, "en": 0, "unknown": 0}
    for lang in conversation_languages.values():
        if lang in language_counts:
            language_counts[lang] += 1
        else:
            language_counts["unknown"] += 1

    question_counts = {}
    for msg in all_messages:
        q = msg["question"].strip()
        question_counts[q] = question_counts.get(q, 0) + 1

    top_questions = [
        {"question": q, "count": c}
        for q, c in sorted(question_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    all_messages.sort(key=lambda m: m.get("created_at", ""), reverse=True)
    recent = all_messages[:20]

    businesses_data = []
    for b in owner_businesses:
        msgs = messages_by_business.get(b["id"], [])
        recent_for_biz = msgs[-8:]
        answered = sum(1 for m in recent_for_biz if m.get("answer", "").strip())
        response_rate = round((answered / len(recent_for_biz)) * 100) if recent_for_biz else 0
        businesses_data.append({
            "id": b["id"],
            "name": b["name"],
            "messages": len(msgs),
            "conversations": len({m["conversation_id"] for m in msgs}),
            "responseRate": response_rate,
        })

    return {
        "total_messages": total_messages,
        "total_conversations": total_conversations,
        "language_counts": language_counts,
        "top_questions": top_questions,
        "recent_messages": [
            {
                "id": m.get("id"),
                "conversation_id": m["conversation_id"],
                "business_id": m["business_id"],
                "business_name": business_names.get(m["business_id"], "Unknown"),
                "language": m.get("language"),
                "question": m.get("question", ""),
                "answer": m.get("answer", ""),
                "created_at": m.get("created_at"),
            }
            for m in recent
        ],
        "businesses": businesses_data,
    }


@app.get("/businesses/{identifier}/documents")
async def get_business_documents(identifier: str, authorization: str | None = Header(default=None)):
    owner = require_owner(authorization)
    business = ensure_owner_business(identifier, owner)
    return {"documents": documents_for_business(business["id"])}


@app.delete("/businesses/{identifier}/documents/{document_id}")
async def delete_business_document(
    identifier: str,
    document_id: str,
    authorization: str | None = Header(default=None),
):
    owner = require_owner(authorization)
    business = ensure_owner_business(identifier, owner)

    documents = sync_documents_from_uploads()
    document = next(
        (
            item
            for item in documents
            if item["id"] == document_id and item["business_id"] == business["id"]
        ),
        None,
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    file_path = document_file_path(document)
    if file_path.exists():
        file_path.unlink()

    write_documents([item for item in documents if item["id"] != document_id])
    chunks = rebuild_business_store(business["id"])
    return {
        "business_id": business["id"],
        "document_id": document_id,
        "remaining_documents": len(documents_for_business(business["id"])),
        "chunks": chunks,
        "message": "Document deleted and vector store rebuilt.",
    }


@app.get("/businesses/{identifier}/inquiries")
async def get_business_inquiries(identifier: str, authorization: str | None = Header(default=None)):
    owner = require_owner(authorization)
    business = ensure_owner_business(identifier, owner)
    return {"inquiries": inquiries_for_business(business["id"])}


@app.post("/businesses/{identifier}/inquiries")
@limiter.limit(RATE_LIMIT_CHAT)
async def create_business_inquiry(identifier: str, payload: InquiryCreate, request: Request):
    business = find_business(identifier)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")
    return save_inquiry(business, payload)


@app.patch("/businesses/{identifier}/inquiries/{inquiry_id}")
async def update_business_inquiry_status(
    identifier: str,
    inquiry_id: str,
    payload: InquiryStatusUpdate,
    authorization: str | None = Header(default=None),
):
    owner = require_owner(authorization)
    business = ensure_owner_business(identifier, owner)

    inquiries = read_inquiries()
    inquiry = next(
        (
            item
            for item in inquiries
            if item["id"] == inquiry_id and item["business_id"] == business["id"]
        ),
        None,
    )
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found.")

    inquiry["status"] = payload.status
    inquiry["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_inquiries(inquiries)
    return inquiry


@app.post("/api/contact")
@limiter.limit(RATE_LIMIT_AUTH)
async def create_contact_message(request: Request, payload: ContactCreate):
    return save_contact(payload)


@app.post("/businesses/{business_id}/documents")
async def upload_business_document(
    business_id: str,
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
):
    owner = require_owner(authorization)
    business = ensure_owner_business(business_id, owner)
    if not file.filename or not (file.filename.lower().endswith(".pdf") or file.filename.lower().endswith(".txt")):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")

    original_name = Path(file.filename).name
    ext = Path(original_name).suffix
    safe_name = f"{uuid4().hex[:16]}{ext}"
    file_path = business_upload_path(business["id"]) / safe_name

    try:
        with file_path.open("wb") as saved_file:
            shutil.copyfileobj(file.file, saved_file)

        texts = process_document(file_path)
        if not texts:
            file_path.unlink(missing_ok=True)
            raise HTTPException(status_code=400, detail="No readable text found in this document.")

        document = upsert_document_metadata(business["id"], file_path, len(texts), original_name)
        chunks = rebuild_business_store(business["id"])
        return {
            "business_id": business["id"],
            "document": document,
            "filename": original_name,
            "chunks": chunks,
            "message": "Document uploaded and indexed successfully.",
        }
    finally:
        file.file.close()


@app.post("/businesses/{identifier}/chat")
@limiter.limit(RATE_LIMIT_CHAT)
async def ask_business_question(identifier: str, query: QueryRequest, request: Request):
    business = find_business(identifier)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")
    language = detect_language(query.question)
    response = answer_for_business(business, query.question, language)
    conversation_id = save_chat_message(
        business_id=business["id"],
        question=query.question,
        answer=response["answer"],
        sources=response["sources"],
        conversation_id=query.conversation_id,
        language=language,
        visitor_ip=request.client.host if request.client else None,
    )
    return {**response, "conversation_id": conversation_id, "language": language}


# ── WebSocket streaming chat ──────────────────────────────────────────────
@app.websocket("/chat/stream")
async def chat_stream(websocket: WebSocket, business_slug: str = Query(default="demo")):
    client_ip = websocket.client.host if websocket.client else "unknown"
    if not _check_ws_rate_limit(client_ip):
        await websocket.close(code=1008, reason="Rate limit exceeded")
        return
    await websocket.accept()
    business = find_business(business_slug)
    if not business:
        await websocket.send_json({"error": "Business not found."})
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_json()
            text = data.get("text", "").strip()
            use_rag = data.get("rag", True)
            if not text:
                continue
            if len(text) > 1000:
                await websocket.send_json({"error": "Message too long (max 1000 characters)."})
                continue

            if use_rag:
                async for token in stream_answer_for_business(business, text):
                    await websocket.send_text(token)
            else:
                async for token in stream_llm_only(business, text):
                    await websocket.send_text(token)
    except WebSocketDisconnect:
        logging.info("WebSocket disconnected")
    except Exception as exc:
        logging.error("WebSocket error: %s", exc)
        try:
            await websocket.send_text(f"Error: {exc}")
        except Exception as e2:
            logging.error("WebSocket send error: %s", e2)
    finally:
        try:
            await websocket.close()
        except Exception as e3:
            logging.error("WebSocket close error: %s", e3)


# ── Frontend-aligned REST endpoints (global, uses default/demo business) ──
DEFAULT_BUSINESS_SLUG = os.getenv("DEFAULT_BUSINESS_SLUG", "sahel")

def _resolve_business_for_owner(authorization: str | None) -> dict:
    owner = require_owner(authorization) if authorization else None
    business = find_business(DEFAULT_BUSINESS_SLUG)
    if not business:
        raise HTTPException(status_code=404, detail="No default business configured.")
    if owner and business.get("owner_id") != owner["id"]:
        raise HTTPException(status_code=403, detail="Access denied.")
    return business


@app.post("/documents")
async def upload_document_frontend(
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
):
    business = _resolve_business_for_owner(authorization)
    return await upload_business_document(business["id"], file, authorization)


@app.get("/documents")
async def list_documents_frontend(authorization: str | None = Header(default=None)):
    business = _resolve_business_for_owner(authorization)
    business_docs = documents_for_business(business["id"])
    return {
        "documents": [
            {
                "document_id": doc["id"],
                "filename": doc["file_name"],
                "size": doc["size_bytes"],
                "content_type": doc["file_type"],
            }
            for doc in business_docs
        ]
    }


@app.delete("/documents/{document_id}")
async def delete_document_frontend(
    document_id: str,
    authorization: str | None = Header(default=None),
):
    business = _resolve_business_for_owner(authorization)
    return await delete_business_document(business["id"], document_id, authorization)


@app.delete("/chat/history")
async def reset_chat_history_frontend(authorization: str | None = Header(default=None)):
    business = _resolve_business_for_owner(authorization)
    business_id = business["id"]
    conversations = read_conversations()
    messages = read_messages()
    write_conversations(
        [c for c in conversations if c.get("business_id") != business_id]
    )
    write_messages([m for m in messages if m.get("business_id") != business_id])
    return {"message": "Chat history cleared."}


# Backward-compatible endpoints for the current frontend while it is being migrated.
@app.post("/upload/{business_id}")
async def upload_document_legacy(
    business_id: str,
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
):
    return await upload_business_document(business_id, file, authorization)


@app.post("/query/{business_id}")
@limiter.limit(RATE_LIMIT_CHAT)
async def ask_question_legacy(business_id: str, query: QueryRequest, request: Request):
    return await ask_business_question(business_id, query, request)


# ── Embed script ─────────────────────────────────────────────────────────

EMBED_LANG = {
    "ar": {"greeting": "مرحباً! كيف يمكنني مساعدتك؟", "placeholder": "اكتب رسالتك..."},
    "fr": {"greeting": "Bonjour ! Comment puis-je vous aider ?", "placeholder": "Écrivez votre message..."},
    "en": {"greeting": "Hello! How can I help you?", "placeholder": "Type your message..."},
}

@app.get("/embed/{slug}.js", response_class=Response)
async def embed_script(slug: str, request: Request):
    business = find_business(slug)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")

    lang_code = SITE_LANG_MAP.get(business.get("language"), "en")
    labels = EMBED_LANG.get(lang_code, EMBED_LANG["en"])
    base_url = str(request.base_url).rstrip("/")
    ws_base = base_url.replace("http://", "ws://").replace("https://", "wss://")

    js = jinja_env.get_template("embed_widget.js").render(
        slug=slug,
        business_name=html.escape(business["name"]),
        greeting=html.escape(labels["greeting"]),
        placeholder=html.escape(labels["placeholder"]),
        ws_url=f"{ws_base}/chat/stream",
        api_url=base_url,
    )
    return Response(content=js, media_type="application/javascript")


# ── Mini-site and QR code ────────────────────────────────────────────────

SITE_TRANSLATIONS = {
    "ar": {
        "chat": "تحدث معنا",
        "qr": "تحميل QR code",
        "highlights": "أبرز الميزات",
        "info": "معلومات الاتصال",
        "phone": "الهاتف",
        "email": "البريد الإلكتروني",
        "city": "المدينة",
        "address": "العنوان",
        "hours": "ساعات العمل",
        "services": "الخدمات",
        "about": "من نحن",
        "social": "وسائل التواصل الاجتماعي",
        "powered_by": "مدعوم من",
    },
    "fr": {
        "chat": "Discuter avec nous",
        "qr": "Télécharger QR code",
        "highlights": "Points forts",
        "info": "Coordonnées",
        "phone": "Téléphone",
        "email": "Email",
        "city": "Ville",
        "address": "Adresse",
        "hours": "Horaires",
        "services": "Services",
        "about": "À propos",
        "social": "Réseaux sociaux",
        "powered_by": "Propulsé par",
    },
    "en": {
        "chat": "Chat with us",
        "qr": "Download QR code",
        "highlights": "Highlights",
        "info": "Contact info",
        "phone": "Phone",
        "email": "Email",
        "city": "City",
        "address": "Address",
        "hours": "Working hours",
        "services": "Services",
        "about": "About",
        "social": "Social media",
        "powered_by": "Powered by",
    },
}

SITE_LANG_MAP = {"ar": "ar", "fr": "fr", "en": "en"}


def _site_context(business: dict, request: Request) -> dict:
    slug = business["slug"]
    lang_code = SITE_LANG_MAP.get(business.get("language"), "en")
    base_url = str(request.base_url).rstrip("/")
    social_links = {}
    raw = business.get("social_media")
    if raw and isinstance(raw, str):
        try:
            social_links = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            pass
    return {
        "business": business,
        "lang": lang_code,
        "t": SITE_TRANSLATIONS.get(lang_code, SITE_TRANSLATIONS["en"]),
        "chat_url": f"{base_url}/chat/{slug}",
        "qr_url": f"{base_url}/b/{slug}/qr",
        "social_links": social_links,
    }


@app.get("/b/{slug}", response_class=HTMLResponse)
async def mini_site(slug: str, request: Request):
    business = find_business(slug)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")
    normalize_business_record(business)
    ctx = _site_context(business, request)
    html = jinja_env.get_template("mini_site.html").render(**ctx)
    return HTMLResponse(content=html)


@app.get("/b/{slug}/qr")
async def business_qr_code(slug: str, request: Request):
    business = find_business(slug)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")

    mini_site_url = str(request.url_for("mini_site", slug=slug))
    qr = qrcode.make(mini_site_url)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    buf.seek(0)
    return Response(
        content=buf.getvalue(),
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{slug}-sahel-qr.png"'},
    )


app.mount("/uploaded_documents", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploaded_documents")
app.mount("/profile_photos", StaticFiles(directory=str(PROFILE_PHOTOS_DIR)), name="profile_photos")


if __name__ == "__main__":
    import uvicorn

    if not os.getenv("SITE_URL"):
        logging.warning("SITE_URL is not set — using localhost fallback for email links")
    uvicorn.run(app, host="0.0.0.0", port=8000)
