import { useState, useEffect, useCallback } from 'react';
import './App.css';
import KHQRDisplay from './components/KHQRDisplay';
import { useTranslations } from './i18n';
import { Globe, Zap, ZapOff, RefreshCw, Loader2, Wallet } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

function App() {
  const [lang, setLang] = useState('en');
  const t = useTranslations(lang);

  const [form, setForm] = useState({
    amount: '1000',
    currency: 'KHR',
    expiry_minutes: '5',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  const checkBackendHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }, [API_BASE]);

  useEffect(() => {
    let cancelled = false;
    async function ping() {
      const alive = await checkBackendHealth();
      if (!cancelled) setBackendStatus(alive ? 'ok' : 'down');
    }
    ping();
    return () => { cancelled = true; };
  }, [checkBackendHealth]);

  const recheckBackend = useCallback(async () => {
    setBackendStatus('checking');
    const alive = await checkBackendHealth();
    setBackendStatus(alive ? 'ok' : 'down');
  }, [checkBackendHealth]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const donationPresets = [
    { label: '5,000 ៛', amount: '5000', currency: 'KHR' },
    { label: '10,000 ៛', amount: '10000', currency: 'KHR' },
    { label: '20,000 ៛', amount: '20000', currency: 'KHR' },
    { label: '$5', amount: '5', currency: 'USD' },
    { label: '$10', amount: '10', currency: 'USD' },
    { label: '$20', amount: '20', currency: 'USD' },
  ];

  function applyPreset(preset) {
    updateForm('amount', preset.amount);
    updateForm('currency', preset.currency);
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const HARDCODED_ACCOUNT = 'lorn_davit@bkrt';
    const HARDCODED_MERCHANT = 'Lorn Davit';

    const payload = {
      account: HARDCODED_ACCOUNT,
      amount: parseFloat(form.amount),
      currency: form.currency,
      merchant_name: HARDCODED_MERCHANT,
      expiry_minutes: parseInt(form.expiry_minutes, 10) || 5,
    };

    if (!payload.amount || payload.amount <= 0) {
      setError(lang === 'km' ? 'សូមបញ្ចូលចំនួនទឹកប្រាក់ត្រឹមត្រូវ' : 'Please enter a valid amount');
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
        setError(lang === 'km' 
          ? 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមប្រាកដថាម៉ាស៊ីនមេកំពុងដំណើរការ។' 
          : 'Cannot connect to the backend. Please make sure the server is running.');
      } else {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleResetToForm() {
    setPaymentData(null);
    setError('');
  }

  function toggleLang() {
    setLang(prev => prev === 'en' ? 'km' : 'en');
  }

  const statusConfig = {
    checking: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', icon: RefreshCw, text: t('form.checking') },
    ok: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Zap, text: t('form.backendConnected') },
    down: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: ZapOff, text: t('form.backendDisconnected') },
  };
  const status = statusConfig[backendStatus];
  const StatusIcon = status?.icon || RefreshCw;

  return (
    <div className={`app-root ${paymentData ? 'payment-mode' : ''}`}>
      {!paymentData ? (
        <div className="min-h-screen flex flex-col">
          {/* Top Navigation Bar */}
          <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className={`text-lg font-bold text-gray-900 ${lang === 'km' ? 'font-moul' : ''}`}>
                  {t('app.title')}
                </span>
              </div>
              <button
                onClick={toggleLang}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition active:scale-95"
              >
                <Globe className="w-4 h-4" />
                {lang === 'en' ? t('lang.khmer') : t('lang.english')}
              </button>
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
            <div className="w-full max-w-md animate-fade-in">
              {/* Hero Section */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-xl shadow-red-200 mb-5">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h1 className={`text-3xl sm:text-4xl font-bold text-gray-900 mb-3 ${lang === 'km' ? 'font-moul leading-relaxed' : ''}`}>
                  {t('app.title')}
                </h1>
                <p className={`text-gray-500 max-w-xs mx-auto leading-relaxed ${lang === 'km' ? 'text-sm' : 'text-base'}`}>
                  {t('app.subtitle')}
                </p>
              </div>

              {/* Card */}
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 animate-slide-up">
                {/* Backend Status */}
                <div className={`flex items-center justify-between mb-6 px-3 py-2 rounded-xl ${status.bg} ${status.border} border`}>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                    <span className={`text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                    {backendStatus === 'checking' && (
                      <Loader2 className={`w-3 h-3 ${status.color} animate-spin`} />
                    )}
                  </div>
                  {backendStatus === 'down' && (
                    <button
                      onClick={recheckBackend}
                      className="text-xs font-medium text-red-600 hover:text-red-700 underline underline-offset-2"
                    >
                      {t('form.retry')}
                    </button>
                  )}
                </div>

                {/* Quick Amounts */}
                <div className="mb-6">
                  <label className={`block text-sm font-semibold text-gray-700 mb-3 ${lang === 'km' ? 'font-moul' : ''}`}>
                    {t('form.quickAmounts')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {donationPresets.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`px-3 py-2.5 text-sm font-medium bg-gradient-to-br from-gray-50 to-gray-100 hover:from-red-50 hover:to-red-100 hover:text-red-700 hover:border-red-200 rounded-xl border border-gray-200 active:scale-[0.97] transition-all duration-150 ${
                          form.amount === preset.amount && form.currency === preset.currency
                            ? 'ring-2 ring-red-400 border-red-300 bg-red-50 text-red-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleGenerate} className="space-y-5">
                  {/* Amount Input */}
                  <div>
                    <label className={`block text-sm font-semibold text-gray-700 mb-1.5 ${lang === 'km' ? 'font-moul' : ''}`}>
                      {t('form.amount')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={form.amount}
                        onChange={(e) => updateForm('amount', e.target.value)}
                        step="0.01"
                        min="0.01"
                        required
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:border-red-400 focus:ring-4 focus:ring-red-50 transition bg-white placeholder:text-gray-300"
                        placeholder={t('form.enterAmount')}
                      />
                    </div>
                  </div>

                  {/* Currency Select */}
                  <div>
                    <label className={`block text-sm font-semibold text-gray-700 mb-1.5 ${lang === 'km' ? 'font-moul' : ''}`}>
                      {t('form.currency')}
                    </label>
                    <select
                      value={form.currency}
                      onChange={(e) => updateForm('currency', e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base font-medium focus:border-red-400 focus:ring-4 focus:ring-red-50 transition bg-white appearance-none"
                    >
                      <option value="KHR">{t('form.currencyKHR')}</option>
                      <option value="USD">{t('form.currencyUSD')}</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1.5">{t('form.currencyHint')}</p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      <span className="mt-0.5">⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-base font-semibold rounded-xl shadow-lg shadow-red-200 transition disabled:opacity-60 active:scale-[0.98] flex items-center justify-center gap-2 ${
                      lang === 'km' ? 'font-moul tracking-wide' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('form.generating')}
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        {t('form.generate')}
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Footer */}
              <div className={`text-center mt-8 text-xs text-gray-400 ${lang === 'km' ? 'leading-relaxed' : ''}`}>
                <p>{lang === 'km' 
                  ? 'ស្កេន KHQR ជាមួយ ABA, Wing ឬកម្មវិធីធនាគារណាមួយដែលគាំទ្រ'
                  : 'Scan KHQR with ABA, Wing, or any KHQR-enabled banking app'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <KHQRDisplay
          data={paymentData}
          onReset={handleResetToForm}
          error={error}
          apiBase={API_BASE}
          lang={lang}
          t={t}
        />
      )}
    </div>
  );
}

export default App;
