# Bakong v2 KHQR - Split (Backend + React Frontend)

This is the original Flask demo refactored into two separate folders:

- `backend/` — Python Flask API (only JSON responses)
- `frontend/` — React + Vite (full UI replica)

## Project Structure

```
D:\Test\
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── ...
│   ├── package.json
│   └── ...
└── README.md
```

## Quick Start (Important: Order Matters)

You **must** start the backend first. Otherwise you will see proxy errors like:

> [vite] http proxy error: /api/khqr  
> AggregateError [ECONNREFUSED]

### 1. Start the Backend (Python)

Open a terminal:

```powershell
cd backend

# Easiest (recommended):
.\start.ps1

# Alternative (explicit, always works):
# .\venv\Scripts\python.exe app.py
```

If PowerShell blocks the script ("running scripts is disabled"), run once:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Setup (only needed the very first time):

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

The backend must be running on **http://localhost:5000** (you should see Flask startup logs).

### 2. Start the Frontend (in a **new** terminal)

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

Vite automatically proxies `/api/*` requests to the backend.

The form page now includes:
- A live backend connection status indicator ("connected" / "not running" + Retry button)
- A permanent command reminder under the form
- A very clear, multi-line error message with exact startup instructions when you get the `ECONNREFUSED` proxy error.

## Troubleshooting the Proxy Error

- Make sure `python app.py` is running and you see the Flask "Running on http://127.0.0.1:5000" message.
- The two processes must run in **separate terminals**.
- If you use a different port for Flask, set `VITE_API_URL=http://localhost:5001` in `frontend/.env` (and update the backend port).

## Current Features

- Simplified donation form (presets for quick amounts; amount + currency chooser)
- Hardcoded recipient (`lorn_davit@bkrt` / "Lorn Davit") for easy team donations
- Generates dynamic KHQR via `bakong_v2` (pip install bakong-v2[image])
- Beautiful mobile-style ABA PayWay KHQR payment panel
- 5-minute expiry + animated clock on timeout
- **Automatic real-time payment polling** (checks status via MD5 + `BAKONG_TOKEN` from backend .env — no token exposed to frontend)
- Success screen with animated checkmark
- Download QR + Download Receipt (HTML) + full card image
- "Try Again" / "Continue Shopping" reset
- Cancel Payment button (aborts session immediately)

## Setup for Auto Payment Check

1. `pip install bakong-v2` (or `bakong-v2[image]` for safe QR images)
2. In `backend/.env` set your Bakong API token (the one that enables `check_payment`):
   ```
   BAKONG_TOKEN=your_bakong_token_here
   ```
   (Use the token provided for MD5-based auto status checks.)
3. Backend uses the token + MD5 for `khqr.check_payment(md5)` automatically (see app.py).
4. Frontend polls `/api/check-payment/<md5>` (no secrets sent to browser).

**For your current production deploys**:
- Backend:  https://payment-test-python.onrender.com
- Frontend: https://payment-test-python.vercel.app/

- On **Vercel** (frontend) set environment variable:
  `VITE_API_URL=https://payment-test-python.onrender.com`
- On **Render** (backend) set:
  `BAKONG_TOKEN=707da48709e943a9744d086ce60b72f4d3319156746b6a5e54456918f29c77b6`
  `CORS_ORIGINS=https://payment-test-python.vercel.app,https://payment-test-python-5ta8t2lop-lorndavids-projects.vercel.app`   (include preview slugs from your Render logs)

- This makes the auto MD5 payment polling work in production. See DEPLOY.md for the full step-by-step + troubleshooting for the CORS error you saw.
- Without the Vercel env var, auto-checking (and even the backend status indicator) will be broken in prod. Manual QR pay still works.

## Notes

- Token is kept server-side only (in backend .env) for security.
- You can still use without token (manual pay via QR works; auto-check just won't trigger).
- All external images (logos, backgrounds, icons) are loaded from the original PayWay CDN to keep visual fidelity.

Enjoy!
