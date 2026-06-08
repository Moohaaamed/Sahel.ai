import json
import os
import re
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import BigInteger, Column, Integer, String, Text, create_engine, delete
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATABASE_URL = f"sqlite:///{BASE_DIR / 'sahel.db'}"


def normalize_database_url(url: str) -> str:
    if url.startswith("postgresql://") and "+psycopg" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    url = re.sub(r":\[([^\]]+)\]@", r":\1@", url)
    if "supabase.co" in url and "sslmode=" not in url:
        url += ("&" if "?" in url else "?") + "sslmode=require"
    return url


load_dotenv()
DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL))

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class OwnerModel(Base):
    __tablename__ = "owners"

    id = Column(String(80), primary_key=True)
    full_name = Column(String(80), nullable=False)
    email = Column(String(120), nullable=False, unique=True, index=True)
    password_hash = Column(String(200), nullable=False)
    verified = Column(String(5), nullable=False, default="true")
    verification_token = Column(String(200), nullable=True)
    reset_code = Column(String(10), nullable=True)
    reset_code_expires = Column(String(40), nullable=True)
    created_at = Column(String(40), nullable=False)
    picture = Column(String(320), nullable=True)


class BusinessModel(Base):
    __tablename__ = "businesses"

    id = Column(String(80), primary_key=True)
    owner_id = Column(String(80), nullable=False, index=True)
    slug = Column(String(120), nullable=False, unique=True, index=True)
    name = Column(String(80), nullable=False)
    business_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False, default="")
    owner_email = Column(String(120), nullable=True)
    owner_phone = Column(String(40), nullable=True)
    site_url = Column(String(160), nullable=False)
    chat_url = Column(String(160), nullable=False)
    city = Column(String(100), nullable=True)
    working_hours = Column(String(100), nullable=True)
    primary_services = Column(Text, nullable=True)
    address = Column(String(300), nullable=True)
    latitude = Column(String(32), nullable=True)
    longitude = Column(String(32), nullable=True)
    cover_image_url = Column(String(320), nullable=True)
    highlights = Column(Text, nullable=True)
    public_knowledge = Column(Text, nullable=True)
    ice = Column(String(20), nullable=True)
    rc = Column(String(30), nullable=True)
    if_tax = Column(String(30), nullable=True)
    patente = Column(String(30), nullable=True)
    cnss = Column(String(30), nullable=True)
    legal_form = Column(String(50), nullable=True)
    social_media = Column(Text, nullable=True)


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String(80), primary_key=True)
    business_id = Column(String(80), nullable=False, index=True)
    file_name = Column(String(260), nullable=False)
    file_type = Column(String(80), nullable=False)
    file_url = Column(String(320), nullable=False)
    chunks = Column(Integer, nullable=False, default=0)
    size_bytes = Column(BigInteger, nullable=False, default=0)
    uploaded_at = Column(String(40), nullable=False)


class ConversationModel(Base):
    __tablename__ = "conversations"

    id = Column(String(80), primary_key=True)
    business_id = Column(String(80), nullable=False, index=True)
    language = Column(String(20), nullable=False, default="en")
    visitor_ip = Column(String(80), nullable=True)
    started_at = Column(String(40), nullable=False)


class MessageModel(Base):
    __tablename__ = "messages"

    id = Column(String(80), primary_key=True)
    business_id = Column(String(80), nullable=False, index=True)
    conversation_id = Column(String(80), nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources = Column(Text, nullable=False, default="[]")
    language = Column(String(20), nullable=False, default="en")
    created_at = Column(String(40), nullable=False)


class InquiryModel(Base):
    __tablename__ = "inquiries"

    id = Column(String(80), primary_key=True)
    business_id = Column(String(80), nullable=False, index=True)
    name = Column(String(80), nullable=False)
    contact = Column(String(120), nullable=False)
    message = Column(Text, nullable=False)
    conversation_id = Column(String(80), nullable=True)
    status = Column(String(20), nullable=False, default="new")
    created_at = Column(String(40), nullable=False)
    updated_at = Column(String(40), nullable=True)


class ContactModel(Base):
    __tablename__ = "contacts"

    id = Column(String(80), primary_key=True)
    name = Column(String(80), nullable=False)
    email = Column(String(120), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(String(40), nullable=False)


TABLE_MODELS = {
    "owners": OwnerModel,
    "businesses": BusinessModel,
    "documents": DocumentModel,
    "conversations": ConversationModel,
    "messages": MessageModel,
    "inquiries": InquiryModel,
    "contacts": ContactModel,
}


def run_migrations():
    from sqlalchemy import text, inspect
    with engine.connect() as conn:
        inspector = inspect(engine)

        for table_name, new_cols in {
            "businesses": {
                "city": "VARCHAR(100)",
                "working_hours": "VARCHAR(100)",
                "primary_services": "TEXT",
                "address": "VARCHAR(300)",
                "latitude": "VARCHAR(32)",
                "longitude": "VARCHAR(32)",
                "cover_image_url": "VARCHAR(320)",
                "highlights": "TEXT",
                "public_knowledge": "TEXT",
                "ice": "VARCHAR(20)",
                "rc": "VARCHAR(30)",
                "if_tax": "VARCHAR(30)",
                "patente": "VARCHAR(30)",
                "cnss": "VARCHAR(30)",
                "legal_form": "VARCHAR(50)",
                "social_media": "TEXT",
            },
            "owners": {
                "verified": "VARCHAR(5)",
                "verification_token": "VARCHAR(200)",
                "reset_code": "VARCHAR(10)",
                "reset_code_expires": "VARCHAR(40)",
                "picture": "VARCHAR(320)",
            },
        }.items():
            allowed_tables = {"businesses", "owners"}
            if table_name not in allowed_tables:
                raise ValueError(f"Unexpected table: {table_name}")
            columns = [c["name"] for c in inspector.get_columns(table_name)]
            for col, col_type in new_cols.items():
                if col not in columns:
                    try:
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col} {col_type}"))
                        conn.commit()
                        print(f"Added column {col} to {table_name} table")
                    except Exception as e:
                        print(f"Error adding column {col}: {e}")


def init_database() -> None:
    auto_create = os.getenv("AUTO_CREATE_TABLES")
    if auto_create is None:
        auto_create = "true" if DATABASE_URL.startswith("sqlite") else "false"

    if auto_create.lower() in {"1", "true", "yes", "on"}:
        Base.metadata.create_all(bind=engine)
    
    try:
        run_migrations()
    except Exception as e:
        print(f"Failed to run migrations: {e}")


def model_to_dict(model: Any) -> dict:
    row = {column.name: getattr(model, column.name) for column in model.__table__.columns}
    if isinstance(model, MessageModel):
        try:
            row["sources"] = json.loads(row["sources"] or "[]")
        except json.JSONDecodeError:
            row["sources"] = []
    return row


def serialize_row(table_name: str, row: dict) -> dict:
    current_row = dict(row)
    if table_name == "messages":
        current_row["sources"] = json.dumps(current_row.get("sources") or [])
    return current_row


def read_table(table_name: str) -> list[dict]:
    model = TABLE_MODELS[table_name]
    with SessionLocal() as session:
        rows = session.query(model).all()
        return [model_to_dict(row) for row in rows]


def write_table(table_name: str, rows: list[dict]) -> None:
    model = TABLE_MODELS[table_name]
    valid_cols = {column.name for column in model.__table__.columns}
    with SessionLocal() as session:
        session.execute(delete(model))
        serialized_rows = []
        for row in rows:
            serialized = serialize_row(table_name, row)
            filtered = {k: v for k, v in serialized.items() if k in valid_cols}
            serialized_rows.append(model(**filtered))
        session.add_all(serialized_rows)
        session.commit()


def table_has_rows(table_name: str) -> bool:
    model = TABLE_MODELS[table_name]
    with SessionLocal() as session:
        return session.query(model.id).first() is not None


def import_json_table(table_name: str, json_path: Path) -> None:
    if table_has_rows(table_name) or not json_path.exists():
        return
    try:
        rows = json.loads(json_path.read_text(encoding="utf-8"))
    except UnicodeDecodeError:
        rows = json.loads(json_path.read_text(encoding="cp1252"))
    if rows:
        write_table(table_name, rows)


def seed_missing_social_media(businesses_json_path: Path) -> None:
    if not businesses_json_path.exists():
        return
    try:
        seed_rows = json.loads(businesses_json_path.read_text(encoding="utf-8"))
    except UnicodeDecodeError:
        seed_rows = json.loads(businesses_json_path.read_text(encoding="cp1252"))
    with SessionLocal() as session:
        for seed_row in seed_rows:
            sm = seed_row.get("social_media")
            if not sm:
                continue
            slug = seed_row.get("slug")
            if not slug:
                continue
            existing = session.query(BusinessModel).filter(
                BusinessModel.slug == slug,
                BusinessModel.social_media.is_(None)
            ).first()
            if existing:
                existing.social_media = sm
        session.commit()


init_database()
