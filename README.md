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

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-blue?logo=python" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Groq-Llama%203.3-F97316?logo=groq" alt="Groq">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

<h1 align="center">Sahel.ai</h1>
<p align="center"><strong>Digital presence platform for Moroccan businesses.</strong><br>
AI-powered business directory with intelligent chatbot, WhatsApp &amp; Telegram bots, and QR-code menus.</p>

<p align="center">
  <a href="https://sahel-ai.vercel.app">🌐 Website</a> ·
  <a href="https://mohamed-20-sahel-api.hf.space">⚡ API</a> ·
  <a href="https://github.com/Moohaaamed/Sahel.ai">📦 Source</a> ·
  <a href="https://t.me/Sahel_ai_bot">🤖 Telegram</a>
</p>

---

## Features

| | |
|---|---|
| **AI Chatbot** | RAG-powered assistant using Groq's Llama 3.3-70b, answers questions based on business documents (PDF, TXT) with source citations |
| **Business Directory** | Browse, search, and manage business profiles with cover photos, social links, contact info, and highlights |
| **QR Code Menus** | Each business gets a downloadable QR code linking to its public mini-site |
| **WhatsApp Bot** | Multi-device bot using Baileys — customers can query businesses directly from WhatsApp |
| **Telegram Bot** | Telegram bot (long-polling) with business selection and AI chat; sends admin notifications on new signups |
| **Embeddable Widget** | JavaScript snippet that any business can embed on their own website for live AI chat |
| **Google OAuth** | One-click sign-in with Google |
| **Multi-language** | Arabic, French, and English UI with real-time switching |
| **Analytics Dashboard** | Per-business analytics: messages, conversations, top questions, language breakdown |
| **Inquiry Management** | Track and manage customer inquiries (new / contacted / closed) |
| **Rate Limiting** | Configurable rate limits per endpoint (SlowAPI) |
| **Responsive Design** | Tailwind CSS + custom design system, mobile-first |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              docker-compose.yml                         │
│                                                                         │
│  ┌──────────────────┐    ┌────────────────────┐  ┌──────────────────┐   │
│  │   Backend        │    │    Website           │  │  WhatsApp Bot    │   │
│  │   (FastAPI)      │◄──►│    (React 19/Vite)   │  │  (Baileys/Node)  │   │
│  │   Port 7860      │    │    Port 80           │  │                  │   │
│  └────────┬─────────┘    └────────────────────┘  └────────┬─────────┘   │
│           │                                                │             │
│           │        POST /businesses/{slug}/chat             │             │
│           ├────────────────────────────────────────────────┘             │
│           │                                                │             │
│           ▼                                                ▼             │
│  ┌──────────────────┐                         ┌────────────────────┐    │
│  │  PostgreSQL /    │                         │  Telegram Bot      │    │
│  │  SQLite          │                         │  (Node/axios,      │    │
│  └──────────────────┘                         │   long-polling)    │    │
│                                               └────────────────────┘    │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  FAISS       │  │  Groq        │  │  Sentence     │  │  JWT Auth  │  │
│  │  Vector DB   │  │  Llama 3.3   │  │  Transformer  │  │  PBKDF2    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │  SendGrid /  │  │  Google      │  │  HuggingFace  │                 │
│  │  SMTP        │  │  OAuth       │  │  Embeddings   │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Business owner** registers, logs in, creates a business profile
2. Uploads documents (PDF, TXT) — documents are chunked, embedded via HuggingFace (`all-mpnet-base-v2`), and indexed into FAISS
3. **Customers** interact via four channels:
   - Website chat interface
   - WhatsApp bot (Baileys)
   - Telegram bot
   - Embeddable JavaScript widget (WebSocket streaming)
4. Questions are matched against FAISS for relevant context, then sent to **Groq (Llama 3.3-70b)** for answer generation
5. Conversations, messages, and inquiries are persisted in the database
6. Owners view analytics and manage inquiries from the dashboard

## Tech Stack

| Category | Technology |
|---|---|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, Alembic, SlowAPI |
| **Frontend** | React 19, Vite, Tailwind CSS, Styled Components |
| **Database** | PostgreSQL (Supabase) with SQLite fallback |
| **AI / RAG** | Groq (Llama 3.3-70b), HuggingFace Embeddings, FAISS, LangChain |
| **Bots** | Baileys (WhatsApp Multi-Device), Telegraf (Telegram) |
| **Email** | SendGrid API + SMTP (Gmail) fallback |
| **Auth** | JWT (PyJWT), PBKDF2 password hashing (600K iterations), Google OAuth |
| **Deployment** | Docker, Docker Compose, Hugging Face Spaces, Vercel |

## Live Demo

| Service | URL |
|---|---|
| **Website** | [sahel-ai.vercel.app](https://sahel-ai.vercel.app) |
| **API** | [mohamed-20-sahel-api.hf.space](https://mohamed-20-sahel-api.hf.space) |
| **Telegram Bot** | [@Sahel_ai_bot](https://t.me/Sahel_ai_bot) |

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 15+ (optional — SQLite works locally)

### 1. Clone & Configure

```bash
git clone https://github.com/Moohaaamed/Sahel.ai.git
cd Sahel.ai
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set GROQ_API_KEY (required), SMTP/SendGrid (for emails)
pip install -r requirements.txt
python backend_chatdoc.py
# → http://localhost:8000
```

### 3. Frontend

```bash
cd website
npm install
npm run dev
# → http://localhost:5173
```

### 4. Docker (Full Stack)

```bash
docker compose up --build
# → Backend: http://localhost:8000
# → Website: http://localhost:4173
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|---|
| `APP_SECRET_KEY` | JWT signing secret (generate with `openssl rand -base64 32`) | **Yes** |
| `GROQ_API_KEY` | API key from [console.groq.com](https://console.groq.com) | **Yes** |
| `DATABASE_URL` | PostgreSQL connection string or `sqlite:///data/sahel.db` | **Yes*** |
| `SITE_URL` | Frontend URL for email links (e.g. `http://localhost:5173`) | **Yes** |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For Google login |
| `SMTP_HOST` | SMTP server (e.g. `smtp.gmail.com`) | For emails |
| `SMTP_USER` | SMTP username | For emails |
| `SMTP_PASS` | SMTP password (Gmail: use app password) | For emails |
| `NOTIFICATION_EMAIL` | Recipient for contact form & inquiry notifications | For emails |
| `SENDGRID_API_KEY` | SendGrid API key (takes priority over SMTP) | For reliable delivery |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from [@BotFather](https://t.me/BotFather) | For Telegram bot |
| `TELEGRAM_ADMIN_CHAT_ID` | Telegram chat ID for new business notifications | For Telegram |
| `DEMO_OWNER_EMAIL` | Demo account email | Optional |
| `DEMO_OWNER_PASSWORD` | Demo account password | Optional |
| `RATE_LIMIT_AUTH` | Auth endpoint rate limit (default: `5/minute`) | Optional |
| `RATE_LIMIT_CHAT` | Chat endpoint rate limit (default: `20/minute`) | Optional |
| `CORS_ORIGINS` | Comma-separated allowed origins | Optional |

*SQLite fallback works out of the box — no database setup needed.

### Website (`website/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (default: `http://localhost:8000`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

### WhatsApp Bot (`whatsapp-bot/.env`)

| Variable | Description |
|---|---|
| `API_BASE` | Backend API URL (e.g. `https://mohamed-20-sahel-api.hf.space`) |
| `DEFAULT_BUSINESS_SLUG` | Default business to connect to (e.g. `sahel`) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (for running Telegram bot from same project) |

## API Overview

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/owners/register` | Register a new business owner |
| `POST` | `/owners/verify` | Verify email via token |
| `POST` | `/owners/resend-verification` | Resend verification email |
| `POST` | `/owners/login` | Login (email + password), returns JWT |
| `POST` | `/owners/google-login` | Google OAuth login |
| `POST` | `/owners/logout` | Clear session |
| `POST` | `/owners/forgot-password` | Request password reset code (6-digit) |
| `POST` | `/owners/verify-reset-code` | Verify reset code |
| `POST` | `/owners/reset-password` | Set new password |

### Business Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/businesses` | List all businesses (`?owner_id=` to filter) |
| `POST` | `/businesses` | Create a business |
| `GET` | `/businesses/{id}` | Get business details (public) |
| `PUT` | `/businesses/{id}` | Update business |
| `DELETE` | `/businesses/{id}` | Delete business |
| `POST` | `/businesses/{id}/cover` | Upload cover image |

### AI Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/businesses/{id}/chat` | Ask a question — returns answer + sources |
| `WS` | `/chat/stream?business_slug={slug}` | WebSocket streaming chat |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/businesses/{id}/documents` | Upload PDF/TXT (indexed into FAISS) |
| `GET` | `/businesses/{id}/documents` | List documents |
| `DELETE` | `/businesses/{id}/documents/{doc_id}` | Delete document |

### Analytics & Inquiries

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/businesses/{id}/analytics` | Business analytics |
| `GET` | `/owner/analytics` | Cross-business analytics |
| `GET` | `/businesses/{id}/inquiries` | List inquiries |
| `POST` | `/businesses/{id}/inquiries` | Create inquiry |
| `PATCH` | `/businesses/{id}/inquiries/{inq_id}` | Update inquiry status |

### Public

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/b/{slug}` | Public mini-site HTML page |
| `GET` | `/b/{slug}/qr` | Download QR code PNG |
| `GET` | `/embed/{slug}.js` | Embeddable chat widget |
| `POST` | `/api/contact` | Submit contact form |

## Project Structure

```
├── backend/                  # FastAPI backend (RAG, auth, API)
│   ├── backend_chatdoc.py    # Main application (2628 lines)
│   ├── storage.py            # SQLAlchemy + JSON data layer
│   ├── data/                 # Seed & runtime data (JSON)
│   ├── templates/            # Jinja2 templates (mini-site, widget)
│   ├── tests/                # Pytest suite
│   ├── scripts/              # Utilities (seeding, migration, 🐛 fixes)
│   ├── alembic/              # Database migrations
│   └── .env.example          # Environment template
├── website/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components (25+)
│   │   ├── i18n/             # Translations (en, fr, ar)
│   │   └── lib/              # Session, routes, utilities
│   └── Dockerfile            # Nginx-based production build
├── whatsapp-bot/             # WhatsApp + Telegram bots
│   ├── index.js              # WhatsApp bot (Baileys)
│   ├── telegram.js           # Telegram bot (long-polling)
│   ├── get-chat-id.js        # Utility to fetch Telegram chat ID
│   └── Dockerfile            # Telegram bot deployment
├── docker-compose.yml        # Full stack orchestration
├── Dockerfile                # Backend container
└── .gitignore
```

## Bots

### Telegram — [@Sahel_ai_bot](https://t.me/Sahel_ai_bot)

```bash
cd whatsapp-bot
cp .env.example .env
# Edit .env: set API_BASE and TELEGRAM_BOT_TOKEN
npm install
npm run telegram
```

**Commands:**
- `/start` or `/menu` — Show help menu
- `/business <slug>` — Select a business (e.g. `/business sahel`)
- `/myid` — Get your Telegram Chat ID (for admin notifications)

### WhatsApp

```bash
cd whatsapp-bot
cp .env.example .env
# Edit .env: set API_BASE and DEFAULT_BUSINESS_SLUG
npm install
npm start
```

A QR code appears in the terminal. Open WhatsApp → Linked Devices → Link a Device → scan the QR.

**Commands:**
- `/start` or `/menu` — Show help menu
- `/business <slug>` — Switch to a different business

## Testing

```bash
cd backend
pytest tests/ -v
```

The test suite uses `FakeGroqClient` to mock LLM calls and covers:
- Language detection (Arabic, French, English)
- Full business lifecycle (create, chat, analytics)
- Inquiry CRUD
- Auth enforcement on private endpoints

Or using the included test scripts:
```bash
python scripts/test_api.py     # End-to-end API smoke test
python scripts/test_social.py  # Social links validation
```

## Deployment

### Hugging Face Spaces (Backend)

Push the `backend/` directory to a Hugging Face Space with Docker SDK:
```bash
git remote add hf https://huggingface.co/spaces/YOUR_USER/sahel-api
git push hf main
```

Set environment variables in the Space settings (Settings → Repository Secrets).

### Vercel (Frontend)

```bash
cd website
npm install
npm run build
```

Deploy the `dist/` folder to Vercel. Set `VITE_API_URL` to your backend URL.

### Railway / Fly.io (WhatsApp Bot)

```bash
cd whatsapp-bot
# Railway: connect repo, root = whatsapp-bot, start = npm start
# Fly.io: fly launch --name sahel-wa-bot; fly deploy
```

## License

MIT — see [LICENSE](LICENSE) for details.
