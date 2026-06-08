---
title: Sahel.ai RAG API
emoji: 🏪
colorFrom: "#E8604C"
colorTo: "#F5A623"
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Sahel.ai Backend

RAG chat API for Moroccan businesses. Deploy on Hugging Face Spaces (free, no credit card).

## Environment Variables

Set these in your HF Space settings:

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Your Groq API key |
| `APP_SECRET_KEY` | Random secret for JWT signing |
| `DATABASE_URL` | `sqlite:////data/sahel.db` (default) |
| `AUTO_CREATE_TABLES` | `true` |
| `DEFAULT_BUSINESS_SLUG` | `sahel` |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `SMTP_HOST` | (optional) Free SMTP server |
| `SMTP_USER` | (optional) SMTP login |
| `SMTP_PASS` | (optional) SMTP password |
| `NOTIFICATION_EMAIL` | (optional) Notification recipient |

## API Endpoints

- `GET /health` — Health check
- `GET /b/{slug}` — Mini-site
- `GET /b/{slug}/qr` — QR code PNG
- `GET /embed/{slug}.js` — Embed widget script
- `POST /businesses/{identifier}/chat` — RAG question
- `WS /chat/stream?business_slug={slug}` — Streaming chat
- `POST /owners/login` — Owner login
- `GET /businesses/{slug}/analytics` — Dashboard data
- `GET /businesses/{slug}/inquiries` — Customer inquiries
- `PATCH /businesses/{slug}/inquiries/{id}` — Update inquiry status
