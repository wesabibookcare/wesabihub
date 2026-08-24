# OmorfiHub Production Deployment Guide

This guide provides step-by-step instructions for deploying the **OmorfiHub** application from this repository to **Vercel**, **Netlify**, **Firebase Hosting**, and **standard Node hosting environments**.

---

## 1. System Architecture Overview

OmorfiHub uses a separated, portable architecture:

1. **Frontend (Vite + React)**: Standard Single Page Application (SPA) built into the static `dist/` directory.
2. **Backend (Express API)**: Modular server logic exposing `/api/*` endpoints.
3. **Platform Adapters**:
   - **Vercel**: Handled via `api/index.ts` (Vercel Serverless Function).
   - **Netlify**: Handled via `netlify/functions/api.ts` (Netlify Function).
   - **Firebase Hosting**: Serves the static `dist/` SPA, proxying `/api/*` to Cloud Functions or an external backend domain.
   - **Standard Node Server**: Executed directly via `npm start` (`node dist/server.cjs`).

---

## 2. Environment Variables Configuration

Copy `.env.example` to set up your environment variables.

### Server-Only Secrets (NEVER expose to the browser)
Set these in your hosting provider's **Environment Variables / Secrets** dashboard:

| Variable Name | Description | Example / Note |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin Service Account JSON string | `{"type": "service_account", ...}` |
| `GOOGLE_MAPS_PLATFORM_KEY` | Server-side Google Maps API Key | Private server API key |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key for payments | `FLWSECK_LIVE-...` |
| `FLUTTERWAVE_WEBHOOK_HASH` | Webhook verification signature hash | Configured in Flutterwave dashboard |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | `sk_live_...` |
| `TELEGRAM_BOT_TOKEN` | Bot token for Telegram notifications | From `@BotFather` |
| `GEMINI_API_KEY` | Gemini AI key for support assistant | From Google AI Studio |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `https://omorfihub.com,https://app.omorfihub.com` |
| `PORT` | Listening port for standalone Node server | Default: `3000` |

### Public Frontend Variables (Bundled into client)
Variables prefixed with `VITE_` are public and embedded during the build phase:

| Variable Name | Description | Example |
|---|---|---|
| `VITE_APP_NAME` | Public product name | `"OmorfiHub"` |
| `VITE_APP_URL` | Canonical public application URL | `"https://omorfihub.com"` |
| `VITE_API_BASE_URL` | Optional API base URL for separate backend hosting | Leave empty for same-origin deployments |
| `VITE_GOOGLE_MAPS_API_KEY` | Public Google Maps client key | Domain-restricted browser key |
| `VITE_FLUTTERWAVE_PUBLIC_KEY` | Flutterwave client public key | `FLWPUBK_LIVE-...` |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack client public key | `pk_live_...` |

---

## 3. Platform Deployment Guides

### A. Vercel
1. Import your GitHub repository in the Vercel Dashboard.
2. Select **Framework Preset**: `Vite`.
3. Configure Build Settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add all environment variables from Section 2 into Vercel **Environment Variables**.
5. Deploy. `vercel.json` will automatically route `/api/*` to `api/index.ts` and `/*` to `dist/index.html`.

### B. Netlify
1. Import your GitHub repository in Netlify.
2. Build & Deploy Settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Functions Directory**: `netlify/functions`
3. Add Environment Variables in Netlify **Site Configuration > Environment Variables**.
4. Deploy. `netlify.toml` will automatically redirect `/api/*` to `/.netlify/functions/api` and `/*` to `index.html`.

### C. Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Authenticate: `firebase login`
3. Build the static frontend:
   ```bash
   npm run build
   ```
4. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
5. `firebase.json` serves the `dist/` directory with `** -> /index.html` SPA fallback rules.
6. *Note*: If hosting the backend on Firebase Cloud Functions, configure the rewrite in `firebase.json`:
   ```json
   "rewrites": [
     { "source": "/api/**", "function": "api" },
     { "source": "**", "destination": "/index.html" }
   ]
   ```

### D. Standard Node.js Host (Docker / Railway / Render / VPS)
1. Build the production application:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```
   This executes `node dist/server.cjs`, serving both the static frontend and the Express `/api/*` backend on port `PORT` (default `3000`).

---

## 4. Webhook URL Setup

Configure your payment provider dashboards with your deployed webhook URL:

* **Vercel**: `https://<your-domain>/api/payment-protection/webhook`
* **Netlify**: `https://<your-domain>/api/payment-protection/webhook`
* **Custom Node Server**: `https://<your-domain>/api/payment-protection/webhook`

---

## 5. Firebase Authentication Authorized Domains

When deploying to a new domain or host:
1. Go to **Firebase Console > Authentication > Settings > Authorized Domains**.
2. Click **Add Domain**.
3. Add your production domain (e.g., `omorfihub.com`, `my-app.vercel.app`, `my-app.netlify.app`).

---

## 6. Verification & Health Diagnostics

### 1. Verify Backend API Health
Call the health endpoint to confirm the deployed API runtime is responsive:
```bash
curl -i https://<your-domain>/api/health
```
**Expected Response (200 OK)**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "production",
  "services": {
    "database": "HEALTHY"
  }
}
```

### 2. Verify SPA Routing
1. Open `https://<your-domain>/` in your browser.
2. Navigate to deep links directly (e.g. `https://<your-domain>/pricing` or `https://<your-domain>/safepay`).
3. Press **Refresh (F5)** on deep links. The React application should re-render cleanly without returning a 404 error.

---

## 7. Troubleshooting & Diagnostics

### Blank White Page
* **Cause 1: Client-Side JS Exception during render**:
  - The application is protected by a top-level `ErrorBoundary` in `src/App.tsx` and `src/main.tsx`. If an unexpected error occurs, a friendly error screen with a "Reload Page" button will display instead of a blank page.
* **Cause 2: Missing SPA rewrite on host**:
  - Ensure your host is serving `index.html` for deep links (`vercel.json`, `netlify.toml`, or `firebase.json`).

### API Requests Returning 404 or CORS Errors
* **Cause 1: Separate frontend/backend host without `VITE_API_BASE_URL`**:
  - If frontend and API are hosted on different domains, set `VITE_API_BASE_URL=https://api.yourdomain.com` in your frontend environment settings and rebuild.
* **Cause 2: Unlisted origin in backend CORS**:
  - Add your frontend domain to `ALLOWED_ORIGINS` in your backend server environment variables (e.g., `ALLOWED_ORIGINS=https://frontend.com,https://omorfihub.com`).

---
*OmorfiHub is a product of Omorfi Limited*
