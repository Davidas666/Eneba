const axios = require('axios');

// Telegram bot konfiguracija
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Funkcija siunčianti lankytojo duomenis į Telegram
const sendVisitorInfoToTelegram = async (visitorData) => {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Telegram bot token arba chat ID nenustatyti');
      return;
    }

    const message = formatVisitorMessage(visitorData);
    
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      }
    );

    console.log('Lankytojo duomenys sėkmingai išsiųsti į Telegram');
  } catch (error) {
    console.error('Klaida siunčiant duomenis į Telegram:', error.message);
  }
};

// Funkcija formatuojanti žinutę
const formatVisitorMessage = (data) => {
  const timestamp = new Date().toLocaleString('lt-LT');
  
  return `
<b>🌐 Nauja svetainės vizitas</b>

<b>⏰ Laikas:</b> ${timestamp}
<b>🌍 IP Adresas:</b> ${data.ip || 'N/A'}
<b>🌐 Host:</b> ${data.host || 'N/A'}
<b>🔗 Referrer:</b> ${data.referrer || 'Tiesiogiai'}
<b>📱 User Agent:</b> ${data.userAgent || 'N/A'}

<b>🖥️ Naršyklė:</b> ${data.browser || 'Nežinoma'}
<b>💻 Operacinė sistema:</b> ${data.os || 'Nežinoma'}
<b>📲 Įrenginys:</b> ${data.deviceType || 'Nežinoma'}

<b>🌎 Vieta:</b> ${data.country || 'Nežinoma'}, ${data.city || 'Nežinoma'}
<b>🕐 Laiko zonė:</b> ${data.timezone || 'N/A'}
  `.trim();
};

module.exports = {
  sendVisitorInfoToTelegram
};
