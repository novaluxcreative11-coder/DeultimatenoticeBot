# DEULTIMATEADSOLUTION Telegram Client Support Bot

**Bot Name:** DEULTIMATE NoticeBoard
**Brand:** DEULTIMATEADSOLUTION
**Tagline:** Smart Advertising. Better Reach. Real Growth.

A complete, production-ready Telegram Client Support and Service Management Bot for DEULTIMATEADSOLUTION, built with **Node.js**, **TypeScript**, **grammY**, **PostgreSQL**, and **Prisma ORM**, optimized for zero-overhead deployment on **Render**.

---

## 🚀 Key Features

1. **📢 Advertising Services Catalog & Interactive Requests**
   - Individual service pages for:
     - Telegram Ads Campaign Setup
     - Telegram Ads Account Support
     - Telegram Ads Rejection Solutions
     - TikTok Ads Campaign Setup
     - TikTok Ads Optimization
     - Targeted Audience & Lead Generation
     - Advertising Consultation
   - 5-step guided request wizard (Name, Objective, Budget, Details).
   - Generates unique tracking code (e.g., `REQ-982143`).
   - Dispatches instant admin alerts to configured Telegram user IDs.

2. **🛠️ Ad Account Troubleshooting & Issue Reporting**
   - Step-by-step reporting for banned/rejected accounts, creative rejections, and billing errors.
   - Secure Telegram screenshot and photo attachment intake.
   - Generates unique ticket references (e.g., `TCK-104928`).
   - Strictly enforces credential privacy (never prompts for passwords or 2FA codes).

3. **📋 Order Tracking System**
   - Customers can look up status via `/track <reference>` or the interactive menu.
   - Displays real-time status: `Pending`, `Under Review`, `In Progress`, `Awaiting Customer`, `Completed`, `Cancelled`.
   - Complete audit trail of administrative progress notes and timestamps.
   - User isolation: customers can only view their own orders and tickets.

4. **💬 Direct Customer Support Chat**
   - Real-time two-way messaging between customers and admins.
   - Admin can reply directly via Telegram button actions.
   - Ticket status management (Open, In Progress, Awaiting Customer, Closed, Reopened).

5. **📚 Dynamic Guides & Tutorials System**
   - Categorized tutorials (Telegram Ads, TikTok Ads, Troubleshooting, Optimization, Marketing Tips).
   - Dynamic management via Telegram Admin Dashboard without changing source code.
   - External video and article documentation links.

6. **🔔 Broadcast Announcements**
   - Broadcast text and photo updates to subscribed users.
   - Rate-limit throttling (30 messages/sec) and delivery counters.
   - User opt-in and opt-out unsubscribe buttons.

7. **⚡ Secure Administrator Console**
   - Protected by `adminGuard` checking numerical Telegram user IDs.
   - Live dashboard metrics (total users, active orders, active tickets).
   - Convert service requests directly to active orders with 1 tap.
   - Update order status with automatic customer push notifications.

---

## ⚙️ Simplified Environment Configuration (Only 2 Variables!)

To deploy this bot, you **only need to manually provide two environment variables**:

```env
BOT_TOKEN=your_bot_token_from_botfather
ADMIN_IDS=123456789,987654321
```

### Automatic Zero-Manual Configuration
All other settings are handled automatically:
- **`DATABASE_URL`**: Render automatically provisions the PostgreSQL database and injects the internal connection string via `render.yaml`.
- **`RENDER_EXTERNAL_URL`**: Render automatically detects the public HTTPS service URL and registers the Telegram Webhook on startup.
- **`WEBHOOK_SECRET`**: Securely and deterministically derived using SHA-256 of the bot token.
- **`PORT`**: Automatically read from Render's environment (defaults to `3000` and binds to `0.0.0.0`).
- **`NODE_ENV`**: Set to `production` in `render.yaml`.

---

## 🤖 Telegram BotFather Setup

1. Open Telegram and search for **[@BotFather](https://t.me/BotFather)**.
2. Send `/newbot` and follow instructions to name the bot **DEULTIMATE NoticeBoard**.
3. Copy the HTTP API token generated (this is your `BOT_TOKEN`).
4. Set description via `/setdescription`:
   ```text
   DEULTIMATEADSOLUTION Support Bot – Request advertising services, report ad account issues, track orders, receive campaign updates and communicate directly with our support team.
   ```
5. Set about text via `/setabouttext`:
   ```text
   Smart Advertising. Better Reach. Real Growth.
   ```
6. Set bot commands via `/setcommands`:
   ```text
   start - Launch the main menu
   help - Help and usage guidance
   track - Look up an order or ticket reference
   support - Open direct support chat
   admin - Administrator Console (Authorized admins only)
   ```

---

## 🚀 Deployment on Render

This repository includes a turnkey **`render.yaml`** Blueprint specification.

### One-Click Blueprint Deployment:
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `DeultimatenoticeBot`.
4. Render will detect `render.yaml` and configure:
   - **Web Service**: `deultimateadsolution-bot` (Node.js runtime, build command: `npm install && npm run db:generate && npm run build`, pre-deploy migration: `npm run db:deploy || npm run db:push`, health check: `/health`).
   - **PostgreSQL Database**: `deultimate-db`.
5. Under Environment Variables, input the two required secrets:
   - `BOT_TOKEN`: Your token from BotFather.
   - `ADMIN_IDS`: Your numerical Telegram ID (use [@userinfobot](https://t.me/userinfobot) to find your ID).
6. Click **Apply Blueprint**.

Render will provision the database, build the TypeScript project, run Prisma migrations, and start the web service. On startup, the service automatically configures the Telegram Webhook with Render's public URL!

---

## 💻 Local Development & Testing

### 1. Prerequisites
- Node.js v22+
- PostgreSQL database (or local Docker)

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Local Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your `BOT_TOKEN` and `ADMIN_IDS`. For local database, set:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/deultimatedb"
```

### 4. Database Setup
```bash
npm run db:generate
npm run db:push
```

### 5. Run Automated Tests
```bash
npm test
```

### 6. Start in Development Mode
```bash
npm run dev
```
*(In local development without `RENDER_EXTERNAL_URL`, the bot automatically falls back to long-polling mode so you don't need a public tunnel like ngrok).*

---

## 🛡️ Security & Reliability

- **Telegram User ID Verification**: Admin commands and actions verify `ctx.from.id` against the parsed `ADMIN_IDS` whitelist.
- **Webhook Deduplication**: All incoming `update_id`s are logged to PostgreSQL with unique constraints to avoid duplicate message processing.
- **Input Sanitization & Escaping**: All user inputs rendered in HTML messages are sanitized through `escapeHtml()` to prevent injection or parse failures.
- **Logger Masking**: Secret tokens, credentials, and connection strings are automatically redacted in structured Pino logs.
- **Health Monitoring**: Dedicated `/health` route reporting uptime and live database connectivity for Render zero-downtime health checks.
