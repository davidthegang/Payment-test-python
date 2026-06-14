import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import axios from 'axios';
import html2canvas from 'html2canvas';

export default function KHQRDisplay({ data, onReset, error: externalError, apiBase = '', lang = 'en', t = () => {} }) {
  const {
    qr_string,
    amount,
    currency,
    merchant_name,
    md5,
    expiry_minutes = 3,
  } = data || {};

  const [status, setStatus] = useState('active');
  const initialSeconds = (Number(expiry_minutes) || 3) * 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [internalError, setInternalError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const displayError = externalError || internalError;

  const qrRef = useRef(null);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const isLowTimeRef = useRef(false);

  useEffect(() => {
    if (!qr_string) return;

    QRCode.toCanvas(qrRef.current, qr_string, {
      width: 220,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).catch((err) => {
      console.error(err);
      setInternalError('Failed to render QR code.');
    });

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timerRef.current);
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus('expired');
          return 0;
        }
        if (next <= 30 && !isLowTimeRef.current) {
          isLowTimeRef.current = true;
        }
        return next;
      });
    }, 1000);

    if (md5) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await axios.post(`${apiBase}/api/check-payment/${md5}`, {});
          if (res.data.status === 'paid') {
            setStatus('success');
            clearInterval(pollRef.current);
            clearInterval(timerRef.current);
          }
        } catch {
          // silent
        }
      }, 4000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [qr_string, md5, apiBase]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displayAmount = Number(amount || 0).toFixed(2);
  const isLowTime = isLowTimeRef.current;

  // Download the entire KHQR card as a clean image (header + logo + merchant + amount + QR)
  const handleDownloadCard = async () => {
    if (!qr_string) return;
    setDownloading(true);

    try {
      // Generate a fresh high-res QR code for the download
      const qrDataUrl = await QRCode.toDataURL(qr_string, {
        width: 440,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });

      // Clone the visible panel for pixel-perfect capture with all CSS styles
      const originalPanel = document.getElementById('stateKHQR');
      if (!originalPanel) throw new Error('Panel not found');

      const clone = originalPanel.cloneNode(true);
      clone.id = 'khqr-clone-for-download';

      // Remove unwanted elements from clone: timer badge, bottom controls
      const timerBadge = clone.querySelector('.khqr-timer-badge');
      if (timerBadge) timerBadge.remove();

      const bottomArea = clone.querySelector('.khqr-bottom');
      if (bottomArea) {
        // Keep only scan-text in bottom area, remove interactive elements
        const scanTextClone = bottomArea.querySelector('.scan-text')?.cloneNode(true);
        bottomArea.innerHTML = '';
        if (scanTextClone) bottomArea.appendChild(scanTextClone);
      }

      // Replace the QR canvas with a high-res image version
      const qrWrap = clone.querySelector('.qr-wrap');
      if (qrWrap) {
        const oldCanvas = qrWrap.querySelector('canvas');
        if (oldCanvas) oldCanvas.remove();

        const qrImg = document.createElement('img');
        qrImg.src = qrDataUrl;
        qrImg.style.cssText = 'display: block; width: 220px; height: 220px; image-rendering: pixelated;';
        qrImg.crossOrigin = 'anonymous';
        qrWrap.insertBefore(qrImg, qrWrap.firstChild);
      }

      // Set clone styles for offscreen rendering using the actual panel width
      const actualWidth = originalPanel.offsetWidth || 400;
      clone.style.cssText = `
        width: ${actualWidth}px;
        position: fixed;
        left: -9999px;
        top: 0;
        border-radius: 0;
        background: #fff;
      `;

      document.body.appendChild(clone);

      // Wait for external images to load
      const imgs = clone.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Small layout settle delay
      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(clone, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      document.body.removeChild(clone);

      const link = document.createElement('a');
      const safeName = (merchant_name || 'payment').toLowerCase().replace(/\s+/g, '-');
      link.download = `khqr-${safeName}-${currency}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Card download failed, falling back to QR canvas', e);
      // Fallback: download the QR canvas only
      if (qrRef.current) {
        const link = document.createElement('a');
        const safeName = (merchant_name || 'payment').toLowerCase().replace(/\s+/g, '-');
        link.download = `khqr-${safeName}-${currency}.png`;
        link.href = qrRef.current.toDataURL('image/png');
        link.click();
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    onReset?.();
  };

  // ─── SUCCESS STATE ───
  if (status === 'success') {
    return (
      <div className="khqr-panel" id="khqrPanel">
        <div className="success-state" id="stateSuccess">
          <div className="img-area">
            <img src="https://checkout.payway.com.kh/images/success-screen.svg" alt="" />
            <div className="handle"><div></div></div>
            <div className="checkmark-wrap zoom-check">
              <svg className="checkmark" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                <path className="checkmark__check" fill="none" fillRule="evenodd" clipRule="evenodd" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
          </div>
          <div className="success-content">
            <h2 className={lang === 'km' ? 'font-moul' : ''}>{t('khqr.success')}</h2>
            <p>{t('khqr.successMsg')}</p>
          </div>
          <div className="success-btn-area">
            <button className="btn-outline" onClick={handleDownloadCard}>
              {lang === 'km' ? 'ទាញយករូបភាព' : 'Download Receipt'}
            </button>
            <button className="btn-solid" onClick={handleCancel}>
              {t('khqr.newPayment')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── EXPIRED STATE ───
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
            <h2 className={lang === 'km' ? 'font-moul' : ''}>{t('khqr.expired')}</h2>
            <p>{lang === 'km' ? (
              <>ចុច <span className="bold">{t('khqr.tryAgain')}</span> ដើម្បីបន្តប្រតិបត្តិការ</>
            ) : (
              <>Press <span className="bold">{t('khqr.tryAgain')}</span> to resume transaction.</>
            )}</p>
          </div>
          <div className="error-btn-area">
            <button className="error-btn" onClick={handleCancel}>{t('khqr.tryAgain')}</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE STATE ───
  return (
    <>
      <div className="khqr-panel" id="khqrPanel">
        {/* Error Banner */}
        {displayError && (
          <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border-b border-red-200 text-sm text-red-700">
            <span className="mt-0.5">⚠️</span>
            <span className="flex-1">{displayError}</span>
            <button onClick={() => setInternalError(null)} className="text-red-400 hover:text-red-600">×</button>
          </div>
        )}
        <div className="khqr-main" id="stateKHQR">
          {/* Timer badge */}
          <div className={`khqr-timer-badge ${isLowTime ? 'urgent' : ''}`}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
              <circle
                cx="20" cy="20" r="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 17}
                strokeDashoffset={(1 - ((initialSeconds - timeLeft) / initialSeconds)) * (2 * Math.PI * 17)}
                style={{ transition: 'stroke-dashoffset 0.5s linear' }}
              />
            </svg>
            <span className="khqr-timer-text">
              {String(minutes).padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>

          {/* Red Header Bar */}
          <div className="khqr-header-bar">
            <div className="bar-handle"></div>
          </div>

          {/* KHQR Logo Area */}
          <div className="khqr-logo-area">
            <img src="https://checkout.payway.com.kh/images/khqr-icon.svg" alt="KHQR" />
          </div>

          {/* Corner Triangle */}
          <div className="khqr-corner">
            <div className="corner-triangle"></div>
          </div>

          {/* Merchant Info */}
          <div className="khqr-merchant">
            <div className="info">
              <div className="store-name" id="merchantName">{merchant_name}</div>
              <div className="price-wrap">
                <span id="priceDisplay">{displayAmount}</span>
                <span className="price-usd" id="currencyDisplay">{currency}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="khqr-divider"></div>

          {/* QR Code Area */}
          <div className="khqr-qr-area">
            <div className="qr-wrap">
              <canvas ref={qrRef} id="qrcode" width="220" height="220" />
              <img src="https://checkout.payway.com.kh/images/usd-khqr-logo.svg" className="qr-logo-overlay" alt="" />
            </div>
          </div>

          {/* Bottom Area */}
          <div className="khqr-bottom">
            <div className="scan-text">{t('khqr.scanToPay')}</div>
            <div className="or-text">{t('khqr.or')}</div>
            <div className="dl-btn-wrap">
              <button className="dl-btn" onClick={handleDownloadCard} disabled={downloading}>
                <img src="https://checkout.payway.com.kh/images/download-icon-khqr.svg" alt="" />
                <span>{downloading ? (lang === 'km' ? 'កំពុងទាញយក...' : 'Downloading...') : t('khqr.downloadQR')}</span>
              </button>
            </div>
            <div className="hint-text">
              {lang === 'km'
                ? 'និងផ្ទុកឡើងទៅកម្មវិធីធនាគារចល័តដែលគាំទ្រ KHQR'
                : 'and upload to Mobile Banking app supporting KHQR'}
            </div>

            {/* Cancel Link */}
            <button className="cancel-link" onClick={handleCancel} type="button">
              {t('khqr.cancel')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
