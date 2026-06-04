require('dotenv').config();
const { writeFileSync, existsSync, readFileSync } = require('fs');
const path = require('path');
const axios = require('axios').default;

const API_BASE = process.env.API_BASE || 'http://localhost:8000';
const DEFAULT_SLUG = process.env.DEFAULT_BUSINESS_SLUG || 'sahel';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TIMEOUT = 30;
const POLL_INTERVAL = 1500;

const userBusinessSlugs = {};
const userSessions = {};
let lastUpdateId = 0;
let running = true;

function loadUserData() {
  const file = path.join(__dirname, 'users.json');
  if (existsSync(file)) {
    try {
      const data = JSON.parse(readFileSync(file, 'utf-8'));
      Object.assign(userBusinessSlugs, data);
    } catch { }
  }
}

function saveUserData() {
  const file = path.join(__dirname, 'users.json');
  try {
    writeFileSync(file, JSON.stringify(userBusinessSlugs, null, 2));
  } catch { }
}

loadUserData();

async function apiCall(method, payload = {}) {
  try {
    const res = await axios.post(`${API}/${method}`, payload, { timeout: 10000 });
    return res.data;
  } catch (err) {
    if (err.response) {
      console.error(`❌ Telegram API error [${method}]:`, err.response.data.description);
    }
    return null;
  }
}

async function sendMessage(chatId, text, opts = {}) {
  return apiCall('sendMessage', { chat_id: chatId, text, ...opts });
}

const menuText = `🤖 *Sahel.ai — AI Assistant*

Commands:
/business <slug>  — Choose a business
/menu or /start   — Show this menu

*To get started:*
1. Send /business <slug> (e.g., /business sahel)
2. Ask your questions directly

💡 Get your business slug from the dashboard.`;

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const sender = String(msg.from.id);
  const text = msg.text.trim();
  const lower = text.toLowerCase();

  if (lower === '/start' || lower === '/menu') {
    return sendMessage(chatId, menuText, { parse_mode: 'Markdown' });
  }

  if (lower.startsWith('/business')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      return sendMessage(chatId, 'Usage: /business <slug>\n\nExample: /business sahel');
    }
    const slug = parts[1].toLowerCase();
    try {
      const res = await axios.get(`${API_BASE}/businesses/${slug}`, { timeout: 10000 });
      userBusinessSlugs[sender] = slug;
      saveUserData();
      return sendMessage(chatId, `✅ Connected to *${res.data.name || slug}*.\n\nSend a message to chat with the AI assistant.`, { parse_mode: 'Markdown' });
    } catch {
      return sendMessage(chatId, `❌ Business "${slug}" not found. Check the slug.`);
    }
  }

  const slug = userBusinessSlugs[sender] || DEFAULT_SLUG;
  if (!userSessions[sender]) {
    userSessions[sender] = { conversation_id: null };
  }

  await apiCall('sendChatAction', { chat_id: chatId, action: 'typing' });

  try {
    const res = await axios.post(`${API_BASE}/businesses/${slug}/chat`, {
      question: text,
      conversation_id: userSessions[sender].conversation_id
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    if (res.status === 200) {
      userSessions[sender].conversation_id = res.data.conversation_id;
      const answer = res.data.answer || "Sorry, I don't have an answer.";
      await sendMessage(chatId, answer);
    }
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    await sendMessage(chatId, `⚠️ Error: ${detail}`);
  }
}

async function poll() {
  while (running) {
    try {
      const res = await axios.get(`${API}/getUpdates`, {
        params: { offset: lastUpdateId + 1, timeout: TIMEOUT },
        timeout: (TIMEOUT + 5) * 1000
      });

      if (res.data.ok && res.data.result.length > 0) {
        for (const update of res.data.result) {
          if (update.update_id >= lastUpdateId) {
            lastUpdateId = update.update_id;
            await handleUpdate(update);
          }
        }
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') continue;
      console.error('⚠️ Poll error:', err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

console.log(`✅ Telegram bot started!`);
console.log(`🤖 @Sahel_ai_bot`);
console.log(`🌐 API: ${API_BASE}`);
console.log(`🏪 Default slug: ${DEFAULT_SLUG}\n`);

poll();

process.on('SIGINT', () => {
  running = false;
  console.log('\n👋 Stopping bot...');
  process.exit(0);
});
