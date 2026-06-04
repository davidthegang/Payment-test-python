import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { AlertTriangle, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KHQRDisplay({ data, onReset, error: externalError, apiBase = '' }) {
  const { 
    qr_string, 
    amount, 
    currency, 
    merchant_name, 
    md5, 
    expiry_minutes = 3,
    account = '',
    qr_image = null   // optional official safe image from backend (data URI)
  } = data || {};

  const [status, setStatus] = useState('active');
  const initialSeconds = (Number(expiry_minutes) || 3) * 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [copied, setCopied] = useState(false);
  const [isLowTime, setIsLowTime] = useState(false);
  const [internalError, setInternalError] = useState(null);

  const displayError = externalError || internalError;

  const qrRef = useRef(null);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!qr_string) return;

    // Generate QR Code - high reliability settings for bank scanners
    // Larger size + High EC level + proper quiet zone (margin) = much more scannable
    QRCode.toCanvas(qrRef.current, qr_string, {
      width: 280,
      margin: 4,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H'
    }).catch((err) => {
      console.error(err);
      setInternalError('Failed to render QR code. Please try again.');
    });

    // Live Countdown for 3 minutes (or configured)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        
        if (next <= 0) {
          clearInterval(timerRef.current);
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus('expired');
          return 0;
        }
        
        if (next <= 30 && !isLowTime) {
          setIsLowTime(true);
        }
        
        return next;
      });
    }, 1000);

    // Polling for auto payment detection (uses backend BAKONG_TOKEN from .env for security)
    // Always attempts when md5 present — no token sent from client.
    // Uses apiBase (from VITE_API_URL) so this works in production deploys
    // (Vercel frontend + separate backend) where there is no Vite dev proxy.
    if (md5) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await axios.post(`${apiBase}/api/check-payment/${md5}`, {});
          if (res.data.status === 'paid') {
            setStatus('success');
            clearInterval(pollRef.current);
            clearInterval(timerRef.current);
          }
        } catch (err) {
          // silent - user can still scan manually
        }
      }, 4000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [qr_string, md5]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const displayAmount = Number(amount || 0).toFixed(2);

  const handleDownloadQR = async () => {
    if (!qr_string) return;
    try {
      // Always generate a high-resolution, clean, bank-scanner-friendly QR code.
      // No logo overlays, high error correction, generous quiet zone.
      const dataUrl = await QRCode.toDataURL(qr_string, {
        width: 640,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      });
      const link = document.createElement('a');
      const safeName = (merchant_name || 'payment').toLowerCase().replace(/\s+/g, '-');
      link.download = `khqr-${safeName}-${currency}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('High-res QR download failed, falling back', e);
      // Fallback to whatever is on screen (still better than before)
      if (qrRef.current) {
        const link = document.createElement('a');
        link.download = `khqr-${(merchant_name || 'payment').toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = qrRef.current.toDataURL('image/png');
        link.click();
      }
    }
  };

  const handleCopy = async () => {
    if (!qr_string) return;
    try {
      await navigator.clipboard.writeText(qr_string);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = qr_string;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    onReset?.();
  };

  // Download the entire KHQR card as high-quality PNG image (for sharing/printing)
  const handleDownloadCardImage = async () => {
    const panel = document.getElementById('khqrPanel');
    if (!panel) return;

    try {
      const canvas = await html2canvas(panel, {
        scale: 3, // higher quality for crisp QR when printed or uploaded
        backgroundColor: '#f0f2f5',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `khqr-donation-${(merchant_name || 'support').toLowerCase().replace(/\s+/g, '-')}-${currency}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to capture card image', err);
      alert('Could not generate image. Please try the Download QR button instead.');
    }
  };

  // SUCCESS STATE - original style with advanced polish
  if (status === 'success') {
    return (
      <div className="khqr-panel" id="khqrPanel">
        <div className="success-state" id="stateSuccess">
          <div className="img-area">
            <img src="https://checkout.payway.com.kh/images/success-screen.svg" alt="" />
            <div className="handle"><div></div></div>
            <div className="checkmark-wrap zoom-check">
              <svg className="checkmark" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"></circle>
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>
                <path className="checkmark__check" fill="none" fillRule="evenodd" clipRule="evenodd" d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>
              </svg>
            </div>
          </div>
          <div className="success-content">
            <h2>Success</h2>
            <p>Payment received successfully.</p>
          </div>
          <div className="success-btn-area">
            <button className="btn-outline" onClick={handleDownloadQR}>Download Receipt</button>
            <button className="btn-solid" onClick={handleCancel}>Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  // EXPIRED STATE - original with clock
  if (status === 'expired') {
    return (
      <div className="khqr-panel" id="khqrPanel">
        <div className="expired-state" id="stateExpired">
          <div className="img-area">
            <img src="https://link.payway.com.kh/images/session-expired.svg" alt="" />
            <div className="handle"><div></div></div>
            <div className="clock">
              <div className="hand hour"></div>
              <div className="hand minute"></div>
            </div>
          </div>
          <div className="expired-content">
            <h2>Session Expired</h2>
            <p>Press <span className="bold">Try Again</span> to resume transaction.</p>
          </div>
          <div className="error-btn-area">
            <button className="error-btn" onClick={handleCancel}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE STATE - exact production ABA PayWay KHQR look + expire features
  return (
    <div className="khqr-panel" id="khqrPanel">
      {/* Error banner */}
      <AnimatePresence>
        {displayError && (
          <div className="bg-red-100 border-b border-red-200 px-4 py-2 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{displayError}</div>
            <button onClick={() => setInternalError(null)} className="text-red-500 hover:text-red-700">×</button>
          </div>
        )}
      </AnimatePresence>

      <div className="khqr-main" id="stateKHQR">
        <div className="khqr-header-bar">
          <div className="bar-handle"></div>
        </div>
        <div className="khqr-logo-area">
          <img src="https://checkout.payway.com.kh/images/khqr-icon.svg" alt="KHQR" />
        </div>
        <div className="khqr-corner">
          <div className="corner-triangle"></div>
        </div>

        <div className="khqr-merchant">
          <div className="info">
            <div className="store-name" id="merchantName">{merchant_name}</div>
            <div className="price-wrap">
              <span id="priceDisplay">{displayAmount}</span>
              <span className="price-usd" id="currencyDisplay">{currency}</span>
            </div>
          </div>
        </div>

        {/* Live countdown timer (top-right of the KHQR card) */}
        <div className="khqr-timer-circle-card">
          <div className="khqr-timer-circle">
            <svg width="52" height="52" viewBox="0 0 52 52">
              {/* Background circle */}
              <circle
                cx="26" cy="26" r="23"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="5"
              />
              {/* Progress circle - fills to full circle over 3 minutes (elapsed time) */}
              <circle
                cx="26" cy="26" r="23"
                fill="none"
                stroke="#ef4444"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 23}
                strokeDashoffset={(1 - ((initialSeconds - timeLeft) / initialSeconds)) * (2 * Math.PI * 23)}
                style={{ transition: 'stroke-dashoffset 0.3s linear' }}
              />
            </svg>
            <div className="khqr-timer-text">
              {String(minutes).padStart(2, '0')}<span className="khqr-timer-unit">mn</span><br />
              {seconds.toString().padStart(2, '0')}<span className="khqr-timer-unit">ss</span>
            </div>
          </div>
        </div>

        <div className="khqr-divider"></div>

        <div className="khqr-qr-area">
          <div className="qr-wrap">
            <canvas ref={qrRef} id="qrcode" width="280" height="280" />
          </div>
        </div>

        <div className="khqr-bottom">
          <div className="scan-text">Scan to Pay</div>
          <div className="or-text">or</div>
          <div className="dl-btn-wrap">
            <button className="dl-btn" onClick={handleDownloadQR}>
              <img src="https://checkout.payway.com.kh/images/download-icon-khqr.svg" alt="" />
              <span>Download QR</span>
            </button>
          </div>
          <div className="hint-text">Download the QR image then upload/scan it in your bank's app for best results</div>
          
          <button className="cancel-link" onClick={handleCancel} type="button">
            Cancel Payment
          </button>

          {/* Download full styled card (QR area inside is clean + high reliability) */}
          <button 
            onClick={handleDownloadCardImage}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-sm text-[#0bbcd4] hover:underline"
            type="button"
          >
            <Download className="w-4 h-4" />
            Download Card as Image (for printing/sharing)
          </button>

          <p className="text-[10px] text-center text-gray-400 mt-1 px-2">
            Best for banks: tap "Download QR" (high-res clean image, no logo over code)
          </p>

          {/* If backend provided an official safe KHQR image (from bakong-v2), offer it as trusted download */}
          {qr_image && (
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.download = `khqr-official-${(merchant_name || 'payment').toLowerCase().replace(/\s+/g, '-')}-${currency}.png`;
                link.href = qr_image;
                link.click();
              }}
              className="mt-1 w-full flex items-center justify-center gap-2 py-1.5 text-xs text-emerald-600 hover:underline"
              type="button"
            >
              <Download className="w-3.5 h-3.5" />
              Download Official Safe KHQR Image (recommended)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
