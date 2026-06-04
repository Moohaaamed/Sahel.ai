# Sahel.ai — WhatsApp Bot 🤖

Bot WhatsApp gratuit pour Sahel.ai utilisant [Baileys](https://github.com/WhiskeySockets/Baileys) (protocole Multi-Device, sans navigateur).

## Prérequis

- [Node.js](https://nodejs.org/) 18+ 
- Un compte WhatsApp
- Backend Sahel.ai déployé (ou en local)

## Installation

```bash
cd whatsapp-bot
npm install
cp .env.example .env
```

Éditez `.env` :

```
API_BASE=https://TON_USER-sahel-api.hf.space
DEFAULT_BUSINESS_SLUG=sahel
```

## Utilisation

```bash
npm start
```

Un QR code s'affiche dans le terminal. Scannez-le avec WhatsApp :
1. Ouvrez WhatsApp sur votre téléphone
2. Menu → Appareils liés → Lier un appareil
3. Scannez le QR code

Une fois connecté, envoyez `/start` au bot depuis WhatsApp.

### Commandes disponibles

| Commande | Description |
|----------|-------------|
| `/start` ou `/menu` | Affiche le menu d'aide |
| `/business <slug>` | Change de commerce (ex: `/business mon-commerce`) |

### Exemple

```
Vous : /start
Bot : 🤖 Sahel.ai — Assistant WhatsApp ...

Vous : /business sahel
Bot : ✅ Connecté à Mon Commerce.

Vous : Quels sont vos horaires ?
Bot : Nos horaires sont de 9h à 19h du lundi au samedi...
```

## Fonctionnement

1. Le bot reçoit votre message WhatsApp
2. Il appelle l'API Sahel.ai : `POST /businesses/{slug}/chat`
3. L'IA répond avec le contenu des documents du commerce
4. La réponse vous est renvoyée sur WhatsApp

Les conversations sont automatiquement suivies (contexte préservé).

## Hébergement gratuit

### Option 1 : Local (votre PC)
- Laissez le terminal ouvert
- Utilisez `screen` / `tmux` sur Linux/Mac

### Option 2 : Railway (gratuit)
```bash
# Sur Railway.app :
# 1. Connectez votre repo GitHub
# 2. Root Directory = whatsapp-bot
# 3. Start Command = npm start
# 4. Ajoutez les variables d'environnement
```

### Option 3 : Fly.io (gratuit)
```bash
fly launch --name sahel-wa-bot
fly deploy
fly secrets set API_BASE=https://TON_USER-sahel-api.hf.space
```

## Dépannage

- **Session expirée** : Supprimez le dossier `session/` et relancez
- **Erreur de connexion** : Vérifiez que `API_BASE` est accessible
- **Timeout** : L'API Sahel.ai met parfois 10-15s à répondre
