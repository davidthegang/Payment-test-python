# Backend - Bakong KHQR API (Flask)

## Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run (Recommended)

**Easiest way (no activation needed):**

```powershell
cd backend
.\start.ps1
```

If you get a "running scripts is disabled" error, run this once:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try `.\start.ps1` again.

Or on plain CMD / double-click:

```cmd
start.bat
```

---

**Manual / alternative:**

```powershell
cd backend
.\venv\Scripts\python.exe app.py
```

(Or activate first: `.\venv\Scripts\Activate.ps1` then just `python app.py`)

API runs on **http://localhost:5000** (local)

In production your backend is at **https://payment-test-python.onrender.com** (and must have `BAKONG_TOKEN` + proper CORS for the frontend at https://payment-test-python.vercel.app)

> **Important**: Keep this server running. The React frontend (port 5173) uses a dev proxy to talk to this API. If the backend is not running you will see `ECONNREFUSED` proxy errors in the Vite terminal.

## Endpoints

- `GET /health`
- `POST /api/khqr`
  - Body: `{ "account": "...", "amount": 1000, "currency": "KHR|USD", "merchant_name": "...", "expiry_minutes": 5 (optional, default 5) }`
  - (Token for auto-check is configured only in backend `.env` as `BAKONG_TOKEN` — never sent from client.)
- `POST /api/check-payment/<md5>`
  - Body: `{ "token": "..." (optional) }`
  - Uses `BAKONG_TOKEN` from backend `.env` if no token provided in body (enables secure auto polling from frontend).

Requires `bakong-v2[image]` (the image extra pulls in Pillow + qrcode for official safe KHQR card images). See requirements.txt.
