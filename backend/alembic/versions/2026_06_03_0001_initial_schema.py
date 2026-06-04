"""initial schema

Revision ID: 202606030001
Revises:
Create Date: 2026-06-03 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202606030001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "owners",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("full_name", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.String(length=40), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_owners_email"), "owners", ["email"], unique=True)

    op.create_table(
        "businesses",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("owner_id", sa.String(length=80), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("business_type", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("owner_email", sa.String(length=120), nullable=True),
        sa.Column("owner_phone", sa.String(length=40), nullable=True),
        sa.Column("site_url", sa.String(length=160), nullable=False),
        sa.Column("chat_url", sa.String(length=160), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_businesses_owner_id"), "businesses", ["owner_id"], unique=False)
    op.create_index(op.f("ix_businesses_slug"), "businesses", ["slug"], unique=True)

    op.create_table(
        "documents",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("business_id", sa.String(length=80), nullable=False),
        sa.Column("file_name", sa.String(length=260), nullable=False),
        sa.Column("file_type", sa.String(length=80), nullable=False),
        sa.Column("file_url", sa.String(length=320), nullable=False),
        sa.Column("chunks", sa.Integer(), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("uploaded_at", sa.String(length=40), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_documents_business_id"), "documents", ["business_id"], unique=False)

    op.create_table(
        "conversations",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("business_id", sa.String(length=80), nullable=False),
        sa.Column("language", sa.String(length=20), nullable=False),
        sa.Column("visitor_ip", sa.String(length=80), nullable=True),
        sa.Column("started_at", sa.String(length=40), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_conversations_business_id"), "conversations", ["business_id"], unique=False)

    op.create_table(
        "messages",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("business_id", sa.String(length=80), nullable=False),
        sa.Column("conversation_id", sa.String(length=80), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("sources", sa.Text(), nullable=False),
        sa.Column("language", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.String(length=40), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_messages_business_id"), "messages", ["business_id"], unique=False)
    op.create_index(op.f("ix_messages_conversation_id"), "messages", ["conversation_id"], unique=False)

    op.create_table(
        "inquiries",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("business_id", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("contact", sa.String(length=120), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("conversation_id", sa.String(length=80), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.String(length=40), nullable=False),
        sa.Column("updated_at", sa.String(length=40), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_inquiries_business_id"), "inquiries", ["business_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_inquiries_business_id"), table_name="inquiries")
    op.drop_table("inquiries")
    op.drop_index(op.f("ix_messages_conversation_id"), table_name="messages")
    op.drop_index(op.f("ix_messages_business_id"), table_name="messages")
    op.drop_table("messages")
    op.drop_index(op.f("ix_conversations_business_id"), table_name="conversations")
    op.drop_table("conversations")
    op.drop_index(op.f("ix_documents_business_id"), table_name="documents")
    op.drop_table("documents")
    op.drop_index(op.f("ix_businesses_slug"), table_name="businesses")
    op.drop_index(op.f("ix_businesses_owner_id"), table_name="businesses")
    op.drop_table("businesses")
    op.drop_index(op.f("ix_owners_email"), table_name="owners")
    op.drop_table("owners")
