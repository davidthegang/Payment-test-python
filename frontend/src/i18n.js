const translations = {
  en: {
    app: {
      title: 'Bakong KHQR Payment',
      subtitle: 'Scan to pay securely via any KHQR-enabled banking app',
    },
    form: {
      amount: 'Amount',
      currency: 'Currency',
      generate: 'Generate KHQR',
      generating: 'Generating...',
      quickAmounts: 'Quick Amounts',
      currencyKHR: 'KHR (Cambodian Riel)',
      currencyUSD: 'USD (US Dollar)',
      enterAmount: 'Enter amount',
      currencyHint: 'Select currency to generate the matching KHQR',
      backendConnected: 'Connected',
      backendDisconnected: 'Disconnected',
      retry: 'Retry',
      checking: 'Checking...',
    },
    khqr: {
      scanToPay: 'Scan to Pay',
      or: 'or',
      downloadQR: 'Download QR',
      downloadHint: 'and upload to Mobile Banking app supporting KHQR',
      cancel: 'Cancel',
      success: 'Payment Successful!',
      successMsg: 'Payment received successfully. Thank you!',
      expired: 'Session Expired',
      expiredMsg: 'The QR code has expired. Please generate a new one.',
      tryAgain: 'Try Again',
      newPayment: 'New Payment',
      merchant: 'Merchant',
    },
    lang: {
      khmer: 'ភាសាខ្មែរ',
      english: 'English',
    },
  },
  km: {
    app: {
      title: 'Bakong KHQR ការទូទាត់',
      subtitle: 'ស្កេនដើម្បីទូទាត់ដោយសុវត្ថិភាពតាមរយៈកម្មវិធីធនាគារដែលគាំទ្រ KHQR',
    },
    form: {
      amount: 'ចំនួនទឹកប្រាក់',
      currency: 'រូបិយប័ណ្ណ',
      generate: 'បង្កើត KHQR',
      generating: 'កំពុងបង្កើត...',
      quickAmounts: 'ចំនួនទឹកប្រាក់រហ័ស',
      currencyKHR: 'រៀល (រូបិយប័ណ្ណកម្ពុជា)',
      currencyUSD: 'ដុល្លារ (រូបិយប័ណ្ណអាមេរិក)',
      enterAmount: 'បញ្ចូលចំនួនទឹកប្រាក់',
      currencyHint: 'ជ្រើសរើសរូបិយប័ណ្ណដើម្បីបង្កើត KHQR ដែលត្រូវគ្នា',
      backendConnected: 'បានតភ្ជាប់',
      backendDisconnected: 'មិនបានតភ្ជាប់',
      retry: 'ព្យាយាមម្តងទៀត',
      checking: 'កំពុងពិនិត្យ...',
    },
    khqr: {
      scanToPay: 'ស្កេនដើម្បីទូទាត់',
      or: 'ឬ',
      downloadQR: 'ទាញយក QR',
      downloadHint: 'និងផ្ទុកឡើងទៅកម្មវិធីធនាគារចល័តដែលគាំទ្រ KHQR',
      cancel: 'បោះបង់',
      success: 'ការទូទាត់បានជោគជ័យ!',
      successMsg: 'ការទូទាត់ត្រូវបានទទួលដោយជោគជ័យ។ សូមអរគុណ!',
      expired: 'វគ្គផុតកំណត់',
      expiredMsg: 'កូដ QR បានផុតកំណត់ហើយ។ សូមបង្កើតថ្មីម្តងទៀត។',
      tryAgain: 'ព្យាយាមម្តងទៀត',
      newPayment: 'ការទូទាត់ថ្មី',
      merchant: 'ឈ្មួញ',
    },
    lang: {
      khmer: 'ភាសាខ្មែរ',
      english: 'English',
    },
  },
};

export function useTranslations(lang) {
  const t = (key) => {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      if (value === undefined) return key;
      value = value[k];
    }
    return value !== undefined ? value : key;
  };
  return t;
}

export default translations;
