import { useState, useEffect } from 'react';
import './App.css';
import KHQRDisplay from './components/KHQRDisplay';

// API base. In dev, Vite proxy handles /api → backend.
// You can override with VITE_API_URL=https://your-backend.onrender.com in a .env file (or Vercel env).
// This is passed to KHQRDisplay so auto payment polling (check by MD5) also works in production.
const API_BASE = import.meta.env.VITE_API_URL || '';

function App() {
  // Simplified donation-focused form state (hardcoded merchant for "my only merchant")
  const [form, setForm] = useState({
    amount: '1000',
    currency: 'KHR',
    expiry_minutes: '5', // fixed for donations
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // When we have payment data, we show the full KHQRDisplay component
  const [paymentData, setPaymentData] = useState(null);

  // Live backend connectivity status
  const [backendStatus, setBackendStatus] = useState('checking');

  async function checkBackendHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function ping() {
      const alive = await checkBackendHealth();
      if (!cancelled) setBackendStatus(alive ? 'ok' : 'down');
    }
    ping();
    return () => { cancelled = true; };
  }, []);

  async function recheckBackend() {
    setBackendStatus('checking');
    const alive = await checkBackendHealth();
    setBackendStatus(alive ? 'ok' : 'down');
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Donation presets - easy for team to use
  const donationPresets = [
    { label: '5,000 KHR', amount: '5000', currency: 'KHR' },
    { label: '10,000 KHR', amount: '10000', currency: 'KHR' },
    { label: '20,000 KHR', amount: '20000', currency: 'KHR' },
    { label: '$5 USD', amount: '5', currency: 'USD' },
    { label: '$10 USD', amount: '10', currency: 'USD' },
    { label: '$20 USD', amount: '20', currency: 'USD' },
  ];

  function applyPreset(preset) {
    updateForm('amount', preset.amount);
    updateForm('currency', preset.currency);
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Hardcoded for "my only merchant" - change these to YOUR real details
    const HARDCODED_ACCOUNT = 'lorn_davit@bkrt'; // <-- IMPORTANT: Replace with your real Bakong account
    const HARDCODED_MERCHANT = 'Lorn Davit'; // <-- IMPORTANT: Replace with your name or team name

    const payload = {
      account: HARDCODED_ACCOUNT,
      amount: parseFloat(form.amount),
      currency: form.currency,
      merchant_name: HARDCODED_MERCHANT,
      expiry_minutes: parseInt(form.expiry_minutes, 10) || 5,
      // token is now only in backend .env for security (auto-check)
    };

    if (!payload.amount || payload.amount <= 0) {
      setError('Please enter a valid donation amount');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/khqr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate KHQR');
      }

      setPaymentData(data);
    } catch (err) {
      const backendAlive = await checkBackendHealth();
      setBackendStatus(backendAlive ? 'ok' : 'down');

      if (!backendAlive) {
        setError('Cannot connect to the backend. Please make sure the server is running.');
      } else {
        setError(err.message || 'Something went wrong generating the donation QR.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleResetToForm() {
    setPaymentData(null);
    setError('');
  }

  return (
    <div className={`app-root ${paymentData ? 'payment-mode' : 'form-mode'}`}>
      {!paymentData ? (
        <div className="w-full max-w-4xl mx-auto px-4">
          {/* Donation Hero - for team donations to me */}
          <div className="text-center mb-8 pt-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
              Support Our Team
            </h1>
            <p className="text-xl text-gray-600 max-w-md mx-auto">
              Donate securely via KHQR using ABA, Wing, or any supported banking app.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Your contributions help us continue our work. Thank you!
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
            {/* Backend status */}
            <div className="backend-status mb-6">
              Backend:{' '}
              {backendStatus === 'checking' && <span className="checking">checking…</span>}
              {backendStatus === 'ok' && <span className="ok">● connected</span>}
              {backendStatus === 'down' && (
                <>
                  <span className="down">● not running</span>
                  <button type="button" className="retry-btn" onClick={recheckBackend}>
                    Retry
                  </button>
                </>
              )}
            </div>

            {/* Quick Donation Presets - easy for team to use */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Quick Donation Amounts
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {donationPresets.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-2.5 text-sm font-medium bg-gray-100 hover:bg-red-100 hover:text-red-700 rounded-2xl transition border border-gray-200 active:scale-[0.985]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form className="khqr-form space-y-5" onSubmit={handleGenerate}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => updateForm('amount', e.target.value)}
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-lg focus:outline-none focus:border-red-500"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => updateForm('currency', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-lg focus:outline-none focus:border-red-500 bg-white"
                >
                  <option value="KHR">KHR (Cambodian Riel)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Select currency to generate the matching KHQR (real KHR or USD).</p>
              </div>

              {error && <div className="form-error">{error}</div>}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold rounded-2xl transition disabled:opacity-70 active:scale-[0.985]"
              >
                {loading ? 'Generating Donation QR...' : 'Generate KHQR for Donation'}
              </button>

              <div className="backend-note text-center">
                Backend must be running. <br className="sm:hidden" />
                For production: Deploy backend to Render/Railway and set VITE_API_URL in Vercel.
              </div>
            </form>
          </div>

          <div className="text-center mt-8 text-sm text-gray-500">
            This site is for our team to easily donate to support the project. <br />
            Scan the generated KHQR with ABA, Wing, or any KHQR-enabled bank app. For reliable scanning on phone, download the high-res QR image and upload it in your banking app.
          </div>
        </div>
      ) : (
        <KHQRDisplay 
          data={paymentData} 
          onReset={handleResetToForm} 
          error={error} 
          apiBase={API_BASE}
        />
      )}
    </div>
  );
}

export default App;
