---
title: Sahel.ai
emoji: 🏪
colorFrom: red
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Sahel.ai

**Digital presence platform for Moroccan businesses.** AI-powered business directory with intelligent chatbot, WhatsApp & Telegram bots, and QR-code menus.

## Features

- **AI Chatbot** — RAG-powered assistant using Groq LLM that answers questions based on business documents (PDFs, text)
- **Business Directory** — Browse, search, and manage business profiles with photos, social links, and contact info
- **QR Code Menus** — Each business gets a scannable QR code linking to its AI chat interface
- **WhatsApp Bot** — Multi-device WhatsApp bot using Baileys for customers to query businesses via WhatsApp
- **Telegram Bot** — Telegram bot with business selection and AI chat, plus admin notifications for new signups
- **Authentication** — Email/password and Google OAuth login with email verification and password reset
- **Multilingual** — Arabic, French, and English UI with i18n support
- **Responsive Design** — Tailwind CSS, works on mobile and desktop

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python — FastAPI, SQLAlchemy, Alembic, SlowAPI rate limiting |
| Frontend | React 19, Vite, Tailwind CSS, Styled Components |
| Database | PostgreSQL (Supabase) with SQLite fallback |
| AI / RAG | Groq, LangChain, Sentence Transformers, FAISS |
| Bots | Baileys (WhatsApp), Telegraf (Telegram) |
| Deployment | Docker, Hugging Face Spaces |
| Email | SendGrid + SMTP fallback |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Website    │────▶│   Backend   │────▶│  Database   │
│  (React +    │     │  (FastAPI)  │     │ (PostgreSQL)│
│   Vite)      │     │             │     └─────────────┘
└─────────────┘     │  ┌───────┐  │
                    │  │ Groq  │  │     ┌─────────────┐
┌─────────────┐     │  │  AI   │  │     │  WhatsApp   │
│  Telegram   │────▶│  └───────┘  │────▶│    Bot      │
│    Bot      │     │             │     │  (Baileys)  │
└─────────────┘     │  ┌───────┐  │     └─────────────┘
                    │  │FAISS  │  │
                    │  │Vector │  │
                    │  │ Store │  │
                    │  └───────┘  │
                    └─────────────┘
```

## Project Structure

```
├── backend/              # FastAPI backend
│   ├── backend_chatdoc.py  # Main application
│   ├── storage.py          # Database layer
│   ├── data/               # JSON data files
│   ├── templates/          # Jinja2 email templates
│   ├── tests/              # Test suite
│   └── .env.example        # Environment template
├── website/              # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── i18n/           # Translations (ar, en, fr)
│   │   └── assets/         # Static assets
│   └── Dockerfile
├── whatsapp-bot/         # WhatsApp bot (Baileys)
│   ├── index.js            # Main entry
│   ├── telegram.js         # Telegram bot
│   └── session/            # WhatsApp session data (gitignored)
├── docker-compose.yml    # Full stack orchestration
└── Dockerfile            # Root Dockerfile (backend)
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (optional, SQLite works for development)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your keys (GROQ_API_KEY, SMTP, etc.)
pip install -r requirements.txt
python backend_chatdoc.py
```

### Frontend

```bash
cd website
npm install
npm run dev
```

### Docker (full stack)

```bash
docker compose up --build
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_SECRET_KEY` | JWT signing secret | Yes |
| `GROQ_API_KEY` | Groq LLM API key | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes* |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For Google login |
| `SMTP_HOST` | SMTP server hostname | For emails |
| `SMTP_USER` | SMTP username | For emails |
| `SMTP_PASS` | SMTP password | For emails |
| `NOTIFICATION_EMAIL` | Contact form recipient | For emails |
| `SENDGRID_API_KEY` | SendGrid API key (preferred over SMTP) | For reliable delivery |
| `SITE_URL` | Frontend URL for email links | Yes |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | For Telegram bot |
| `TELEGRAM_ADMIN_CHAT_ID` | Admin chat ID for notifications | For Telegram |

*SQLite fallback: `sqlite:///data/sahel.db`

## Deployment

The backend is deployed on **Hugging Face Spaces**:

- **API**: [https://mohamed-20-sahel-api.hf.space](https://mohamed-20-sahel-api.hf.space)
- **Website**: Deployed via Docker with Nginx
- **Source**: [github.com/Moohaaamed/Sahel.ai](https://github.com/Moohaaamed/Sahel.ai)

## Bots

### Telegram

**Bot**: [@Sahel_ai_bot](https://t.me/Sahel_ai_bot)

Commands:
- `/start` or `/menu` — Show menu
- `/business <slug>` — Select a business (e.g., `/business sahel`)
- `/myid` — Get your Telegram chat ID (for admin setup)

### WhatsApp

Run locally or deploy to Railway/Fly.io:
```bash
cd whatsapp-bot
npm install
cp .env.example .env
npm start
# Scan the QR code with WhatsApp
```

## License

MIT
