const { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, getContentType } = require('@whiskeysockets/baileys');
const { writeFileSync, existsSync, readFileSync, mkdirSync } = require('fs');
const path = require('path');
const pino = require('pino');
const axios = require('axios').default;
const qrcode = require('qrcode-terminal');

const API_BASE = process.env.API_BASE || 'http://localhost:8000';
const DEFAULT_SLUG = process.env.DEFAULT_BUSINESS_SLUG || 'sahel';
const SESSION_DIR = path.join(__dirname, 'session');

const userSessions = {};
const userBusinessSlugs = {};
let reconnectAttempt = 0;
let shutdown = false;

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

async function getBotNumber(sock) {
  try {
    const id = sock.user?.id;
    if (id) return id.replace(/:.*/, '');
  } catch { }
  return 'unknown';
}

function extractText(msg) {
  try {
    const contentType = getContentType(msg.message);
    if (!contentType) return null;
    const content = msg.message[contentType];
    if (contentType === 'conversation') return content.text || content;
    if (contentType === 'extendedTextMessage') return content.text || '';
    return null;
  } catch {
    return null;
  }
}

async function handleMessage(sock, msg) {
  try {
    const key = msg.key;
    const remoteJid = key.remoteJid;
    const fromMe = key.fromMe;

    if (fromMe) return;
    if (!remoteJid) return;
    if (remoteJid.endsWith('@g.us') || remoteJid.endsWith('@broadcast')) return;

    const text = extractText(msg);
    if (!text || !text.trim()) return;

    const normalizedText = text.toLowerCase().trim();
    const sender = remoteJid.replace('@s.whatsapp.net', '');

    console.log(`📩 Message de ${sender}: ${text.slice(0, 60)}`);

    if (normalizedText.startsWith('/start') || normalizedText.startsWith('/menu')) {
      return sendMenu(sock, remoteJid);
    }

    if (normalizedText.startsWith('/business')) {
      const parts = text.split(/\s+/);
      if (parts.length >= 2) {
        const slug = parts[1].toLowerCase();
        try {
          const res = await axios.get(`${API_BASE}/businesses/${slug}`);
          if (res.status === 200) {
            userBusinessSlugs[sender] = slug;
            saveUserData();
            await sock.sendMessage(remoteJid, {
              text: `✅ Connecté à *${res.data.name || slug}*.\n\nEnvoyez un message pour discuter avec l'assistant IA.`
            });
          }
        } catch {
          await sock.sendMessage(remoteJid, {
            text: `❌ Commerce "${slug}" introuvable. Vérifiez le slug.`
          });
        }
      } else {
        await sock.sendMessage(remoteJid, {
          text: `Utilisation : /business <slug>\n\nExemple : /business sahel`
        });
      }
      return;
    }

    const slug = userBusinessSlugs[sender] || DEFAULT_SLUG;
    if (!userSessions[sender]) {
      userSessions[sender] = { conversation_id: null };
    }

    await sock.sendPresenceUpdate('composing', remoteJid);

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
        const answer = res.data.answer || "Désolé, je n'ai pas de réponse.";
        await sock.sendMessage(remoteJid, { text: answer });
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      await sock.sendMessage(remoteJid, {
        text: `⚠️ Erreur : ${detail}`
      });
    }
  } catch (err) {
    console.error('❌ Erreur handleMessage:', err.message);
  }
}

async function sendMenu(sock, jid) {
  await sock.sendMessage(jid, {
    text: `🤖 *Sahel.ai — Assistant WhatsApp*

Commandes disponibles :
/business <slug>   — Choisir un commerce
/menu ou /start    — Afficher ce menu

*Pour commencer :*
1. Tapez /business <slug> (ex: /business sahel)
2. Posez vos questions directement

💡 Pour obtenir le slug de votre commerce, connectez-vous au dashboard.`
  });
}

function getReconnectDelay() {
  const delays = [5000, 15000, 30000, 60000];
  const idx = Math.min(reconnectAttempt, delays.length - 1);
  return delays[idx] + Math.floor(Math.random() * 5000);
}

async function startBot(pairingPhone) {
  if (shutdown) return;
  if (!existsSync(SESSION_DIR)) {
    mkdirSync(SESSION_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    auth: state,
    browser: Browsers.windows('Desktop'),
    logger: pino({ level: process.env.LOG_LEVEL || 'silent' }),
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  if (pairingPhone) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(pairingPhone);
        console.log('\n══════════════════════════════════════════');
        console.log('  CODE D\'APPARIEMENT');
        console.log(`  ${code}`);
        console.log('══════════════════════════════════════════\n');
        console.log('  Ouvrez WhatsApp → Appareils liés → Lier un appareil');
        console.log('  → Associer via un numéro de téléphone');
        console.log('  Entrez le code ci-dessus.\n');
      } catch (e) {
        console.log('⚠️ Impossible de générer le code:', e.message);
        console.log('   Utilisation du QR code...');
      }
    }, 2000);
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr && !pairingPhone) {
      reconnectAttempt = 0;
      console.log('\n══════════════════════════════════════════');
      console.log('  SCANNEZ CE QR CODE AVEC VOTRE WHATSAPP');
      console.log('  1. Ouvrez WhatsApp sur votre téléphone');
      console.log('  2. Menu → Appareils liés → Lier un appareil');
      console.log('  3. Scannez le QR code ci-dessous');
      console.log('══════════════════════════════════════════\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      reconnectAttempt = 0;
      const botNumber = await getBotNumber(sock);
      console.log(`\n✅ WhatsApp bot connecté !`);
      console.log(`📱 Numéro : ${botNumber}`);
      console.log(`🌐 API : ${API_BASE}`);
      console.log(`🏪 Slug par défaut : ${DEFAULT_SLUG}\n`);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      const reason = DisconnectReason[statusCode] || statusCode || 'unknown';
      console.log(`⚠️ Déconnecté (${reason}). Reconnexion : ${shouldReconnect}`);
      if (shouldReconnect) {
        reconnectAttempt++;
        const delay = getReconnectDelay();
        console.log(`⏳ Reconnexion dans ${Math.round(delay / 1000)}s (tentative #${reconnectAttempt})`);
        setTimeout(() => startBot(), delay);
      } else {
        console.log('❌ Session expirée. Supprimez le dossier session/ et relancez.');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      await handleMessage(sock, msg);
    }
  });
}

const phoneArg = process.argv.find(a => a.startsWith('--phone='));
const pairingPhone = phoneArg ? phoneArg.replace('--phone=', '') : null;

if (pairingPhone) {
  console.log(`📱 Mode appairage par numéro activé pour : ${pairingPhone}`);
}

startBot(pairingPhone).catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  shutdown = true;
  console.log('\n👋 Arrêt du bot...');
  process.exit(0);
});
