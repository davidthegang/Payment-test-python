# Hosting on Vercel (Frontend) + Backend

## 1. Backend (Python Flask + Bakong)

The backend **must** be deployed separately because it uses Python.

### Recommended free options:
- **Render.com** (easiest for Flask)
- Railway.app
- Fly.io

### Steps for Render.com (free tier):
1. Push your code to GitHub.
2. Go to https://render.com and create a new **Web Service**.
3. Connect your repo, select the `backend` folder or root.
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `gunicorn app:app` (or `python app.py` for testing)
6. Add Environment Variable:
   - Key: `BAKONG_TOKEN`
   - Value: 707da48709e943a9744d086ce60b72f4d3319156746b6a5e54456918f29c77b6   (your token)
   - (Optional but recommended) Key: `CORS_ORIGINS`
   - Value: https://payment-test-python.vercel.app
7. Deploy. Your backend will be at: https://payment-test-python.onrender.com

## 2. Frontend (React + Vite) on Vercel

1. Install Vercel CLI or use the dashboard.
2. In Vercel dashboard: New Project → Import Git Repository.
3. Set **Root Directory** to `frontend`.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL` = https://payment-test-python.onrender.com   (your Render backend URL, no trailing slash)
7. Deploy.

Your frontend will be at: https://payment-test-python.vercel.app/

## 3. Important .env files

- **backend/.env** (never commit):
  ```
  BAKONG_TOKEN=your_real_token_here
  ```

- **frontend/.env** (for local):
  ```
  VITE_API_URL=http://localhost:5000
  ```

For production Vercel, set the env var in the dashboard (not in code).

## 4. Customization for "My Only Merchant"

In `frontend/src/App.jsx`:
- Edit `HARDCODED_ACCOUNT` and `HARDCODED_MERCHANT`
- Add your real Bakong account and name.

The site is now optimized as a **donation page** for your team.

## 5. KHR and USD + Image Downloads

- Select currency (KHR or USD) → Generate
- After the QR appears, click **"Download Card as Image"** to get a high-quality PNG of the full beautiful KHQR card.
- Repeat for the other currency to have images for both "real" (KHR) and USD.

Perfect for printing or sharing donation QR codes.

## Notes
- The timer is 5 minutes for donations (easy to change).
- Fully responsive (phones, tablets, desktop).
- Error handling and backend status included.
- **Auto payment checking (by MD5)**: Requires `VITE_API_URL` set on the frontend (Vercel) so the React app can reach your backend for polling `/api/check-payment/<md5>`. The actual Bakong token lives only in the backend env (never sent to browser).
- For production, the Bakong token is safely stored only in the backend .env (never sent to browser).
- CORS on backend allows any `https://*.vercel.app` (using proper regex) + localhost. If using a custom frontend domain, set the `CORS_ORIGINS` environment variable on the backend host (comma-separated list of exact URLs or regexes).

## Troubleshooting CORS / "backend not running" in production

If you see in the browser console:

```
Access to fetch at 'https://your-backend.onrender.com/health' from origin 'https://your-frontend.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

This means the browser (on your Vercel frontend) is calling the Render backend, the request succeeds (200), but the response lacks the required `Access-Control-Allow-Origin` header. The browser therefore blocks the response from being read by JavaScript (you'll also see `ERR_FAILED`).

**Common cause + fix:**
- The old glob pattern `"https://*.vercel.app"` in `backend/app.py` was being treated as a *regex* by flask-cors (where `*` means "repeat previous character"), so it never matched real origins like `https://payment-test-python.vercel.app`.
- We fixed it in the code to use the proper regex `r"https://.*\.vercel\.app$"` (plus support for a `CORS_ORIGINS` env var).

**Steps to resolve (for your exact deploys):**
1. Make sure your local code has the updated `backend/app.py` (it now explicitly allows `https://payment-test-python.vercel.app` + the regex).
2. Commit + push the change to GitHub.
3. On **Render** (https://payment-test-python.onrender.com):
   - Trigger a manual deploy (or auto-deploy on push).
   - Make sure these env vars are set:
     - `BAKONG_TOKEN` = 707da48709e943a9744d086ce60b72f4d3319156746b6a5e54456918f29c77b6
     - `CORS_ORIGINS` = https://payment-test-python.vercel.app,https://payment-test-python-5ta8t2lop-lorndavids-projects.vercel.app   (include the preview slug you see in Render logs or browser errors)
4. On **Vercel** (https://payment-test-python.vercel.app/):
   - In Project Settings → Environment Variables, add:
     - `VITE_API_URL` = https://payment-test-python.onrender.com
   - Redeploy the frontend (or it may auto-redeploy).
5. Hard refresh the Vercel site (Ctrl+Shift+R). The backend status should go from "● not running" / "checking…" to "● connected".
6. Once connected, test "Generate KHQR for Donation". The auto payment polling (MD5-based check every 4s) will now work because both the initial calls and the background polling in KHQRDisplay use the correct `VITE_API_URL` + the backend has proper CORS.

If you still see the error after redeploy:
- Double-check `VITE_API_URL` on Vercel exactly matches the Render URL (no trailing slash).
- Check Render logs for any startup errors (the CORS middleware runs at import time).
- Temporarily set `CORS_ORIGINS=*` on Render (insecure, only for debugging) and see if it goes away — then switch back to specific value(s).

The same CORS rules protect the auto payment status polling, so once /health works, the rest of the donation flow should too.

Enjoy your donation site!
