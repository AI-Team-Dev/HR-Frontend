# Job Portal Frontend – Production Guide

This project is a Vite + React + Tailwind SPA prepared for secure, production deployments. It integrates with a remote backend API over HTTPS using a single environment variable: `VITE_API_URL`.

## 1) Setup

- Node.js 18+ recommended
- Install deps:

```bash
npm ci
```

- Environment variables (create a `.env` file locally; `.env*` is gitignored):

```
VITE_API_URL=https://api.example.com
# optional
VITE_API_TIMEOUT_MS=15000
```

Notes:
- Only `VITE_API_URL` is used by the app. Remove any old variables like `VITE_API_BASE`.
- For local development against a backend on http://localhost:3000, set `VITE_API_URL=http://localhost:3000`.

## 2) Backend Expectations

- CORS must allow your frontend origin and credentials if you use cookies:
  - Access-Control-Allow-Origin: https://your-frontend.example.com
  - Access-Control-Allow-Credentials: true
  - Access-Control-Allow-Headers: Content-Type, Authorization
- Endpoints used by this app (prefixes are preprended by `VITE_API_URL`):
  - POST `/api/candidate/login`
  - POST `/api/candidate/signup`
  - POST `/api/hr/signup`
  - GET `/api/jobs`
  - POST `/api/jobs` (requires auth)
- Auth options:
  - Bearer token in `Authorization` header (default in this repo; token kept in memory only)
  - Or, HttpOnly session/JWT cookies set by the backend, with `SameSite=Lax` and `Secure`.

## 3) Security & Auth

- The app uses a small `tokenService` that holds an in-memory token.
- On 401 responses, the app logs out automatically.
- To switch to HttpOnly cookies:
  - Have your backend set a secure HttpOnly cookie on login
  - Stop returning a token to the client (or ignore it)
  - Ensure CORS allows credentials and domains
  - `credentials: 'include'` is already enabled in the API client

## 4) Building

```bash
npm run build
```

- Source maps are disabled in production builds
- Modern target: `es2018`

## 5) Deployment

This app is a client-side SPA. Use the provided SPA fallbacks.

- Netlify:
  - `dist/` as publish directory
  - `_redirects` file is included to route `/* -> /index.html 200`
- Cloudflare Pages:
  - `dist/` as build output
  - `_redirects` is supported for SPA fallback
- Vercel:
  - Use "Build & Output Settings" → Output directory `dist`
  - Add a root-level route fallback if needed, or rely on a static `404.html` (included) that redirects to `/`

## 6) Local Development

```bash
npm run dev
```

- The app runs with BrowserRouter and expects SPA fallback on production hosts.

## 7) Observability and Errors

- Network errors log to console only in development
- A minimal toast system presents API errors and status to users

## 8) Folder Notes

- `src/utils/api.js` – base API client with timeout, JSON/FormData, 401 handling
- `src/utils/tokenService.js` – in-memory token holder
- `src/context/AppContext.jsx` – global data + auth flows
- `public/_redirects` – SPA fallback (Netlify/CF Pages)
- `public/404.html` – SPA fallback for hosts that use 404-based rewrites

## 9) Troubleshooting

- 401 loop: confirm backend CORS allows your origin and credentials when using cookies
- Mixed content: ensure `VITE_API_URL` is `https://` in production
- 404 on refresh: verify SPA fallback is configured on your host
