const https = require('https');

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
    
    const data = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('Lankytojo duomenys sėkmingai išsiųsti į Telegram');
            resolve(true);
          } else {
            console.error('Telegram klaida:', responseData);
            reject(new Error(responseData));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Klaida siunčiant duomenis į Telegram:', error.message);
        reject(error);
      });

      req.write(data);
      req.end();
    });
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
