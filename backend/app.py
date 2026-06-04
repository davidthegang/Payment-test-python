from flask import Flask, request, jsonify
from flask_cors import CORS
from bakong_v2 import KHQR
import os
from dotenv import load_dotenv

load_dotenv()
BAKONG_TOKEN = os.getenv('BAKONG_TOKEN', '')

app = Flask(__name__)

# CORS configuration for local dev + Vercel frontend deploys.
# Your current setup:
#   Frontend (production): https://payment-test-python.vercel.app
#   Frontend (current preview): https://payment-test-python-5ta8t2lop-lorndavids-projects.vercel.app
#   Backend: https://payment-test-python.onrender.com
#
# We list exact matches for your known frontends + a regex catch-all.
# You can also override/extend via CORS_ORIGINS env var on Render.
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://payment-test-python.vercel.app",  # your main Vercel frontend
    "https://payment-test-python-5ta8t2lop-lorndavids-projects.vercel.app",  # current preview/deployment slug from logs
    r"https://.*\.vercel\.app$",   # catch-all for any other vercel previews or future deploys
]
env_origins = os.getenv("CORS_ORIGINS", "")
if env_origins:
    CORS_ORIGINS.extend([o.strip() for o in env_origins.split(",") if o.strip()])

CORS(app, origins=CORS_ORIGINS)

@app.route('/', methods=['GET', 'HEAD'])
def index():
    return jsonify({
        'status': 'ok',
        'message': 'Bakong KHQR backend is running',
        'endpoints': ['/health', '/api/khqr (POST)', '/api/check-payment/<md5> (POST)'],
        'frontend': 'https://payment-test-python.vercel.app'
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/khqr', methods=['POST'])
def generate_khqr():
    data = request.get_json() or {}

    account = data.get('account')
    amount = data.get('amount')
    currency = data.get('currency', 'KHR')
    merchant_name = data.get('merchant_name', 'Bakong Merchant')
    expiry_minutes = int(data.get('expiry_minutes', 3))

    if not account or amount is None:
        return jsonify({'error': 'account and amount are required'}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'amount must be greater than 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'invalid amount'}), 400

    try:
        khqr = KHQR()
        # expiration in DAYS (library minimum 1). Use 7 for a comfortably "safe" window
        # even if the on-screen timer is only a few minutes for UX.
        qr_string = khqr.create_qr(
            bank_account=account,
            merchant_name=merchant_name,
            merchant_city='Phnom Penh',
            amount=amount,
            currency=currency,
            static=False,
            expiration=7,
        )
        md5 = khqr.generate_md5(qr_string)

        # Generate an official, safe, scannable KHQR image using bakong-v2[image].
        # This produces a proper card with the QR (good quiet zone, high contrast, logo placed safely outside data area).
        # Frontend falls back to client-side clean render if not present.
        official_image = None
        try:
            official_image = khqr.qr_image(qr_string, format="base64_uri")
        except Exception:
            # Image extra not available or generation failed — string + client renderer is still safe now.
            pass

        return jsonify({
            'qr_string': qr_string,
            'md5': md5,
            'account': account,
            'merchant_name': merchant_name,
            'amount': round(amount, 2),
            'currency': currency,
            'expiry_minutes': expiry_minutes,
            'qr_image': official_image,   # e.g. "data:image/png;base64,..." or null
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/check-payment/<md5>', methods=['POST'])
def check_payment(md5):
    data = request.get_json() or {}
    token = data.get('token', '') or BAKONG_TOKEN

    if not token:
        return jsonify({'status': 'unknown'})

    try:
        khqr = KHQR(token=token)
        result = khqr.check_payment(md5)
        status = (result or '').lower()
        return jsonify({'status': status})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
