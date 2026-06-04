# Frontend - Bakong KHQR React

React + Vite frontend for the Bakong v2 KHQR payment demo.

## Setup

```powershell
cd frontend
npm install
```

## Run (dev)

```powershell
npm run dev
```

Runs on http://localhost:5173.

**The backend must be running first** (port 5000). The Vite dev server proxies all `/api` calls to the Flask backend.

If you see this in the Vite terminal:

```
[vite] http proxy error: /api/khqr
AggregateError [ECONNREFUSED]
```

→ It means the Python backend is not running. Start it in another terminal first.

The UI now shows a very clear error message + instructions when the backend is unreachable.

## Environment Variable (optional)

You can point the frontend at a different backend URL by creating `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

(Leave empty to use the built-in Vite proxy during development.)

## Build

```powershell
npm run build
npm run preview
```

## Features

- Matches original Flask template UI (form + animated KHQR panel)
- Exact copy of the payment UI with expired / success states + animations
- **Auto polling for payment status** (always enabled via MD5; uses backend `BAKONG_TOKEN` from .env — no client token)
- 5-minute expiry timer
- Download QR (PNG) and Receipt (HTML) + high-res card image
- Uses `qrcode` package for canvas QR rendering

## Environment / Production

In production, set `VITE_API_URL` (e.g. to your backend https://... URL, no trailing slash) in Vercel dashboard or .env.
This is **required for auto payment checking** (the MD5 polling to `/api/check-payment/<md5>` uses it; without the proxy in prod it would fail).
Generate + health checks already respected it. See DEPLOY.md.
