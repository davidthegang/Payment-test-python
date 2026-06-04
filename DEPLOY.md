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
   - Value: your real Bakong token (from @KHQRNotificationBot)
7. Deploy. Copy the public URL (e.g. https://your-app.onrender.com)

## 2. Frontend (React + Vite) on Vercel

1. Install Vercel CLI or use the dashboard.
2. In Vercel dashboard: New Project → Import Git Repository.
3. Set **Root Directory** to `frontend`.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL` = the backend URL from step 1 (without trailing slash)
7. Deploy.

Vercel will give you a URL like `https://your-project.vercel.app`

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
- CORS on backend allows `https://*.vercel.app`. If using a custom frontend domain, update `origins` in `backend/app.py`.

Enjoy your donation site!
