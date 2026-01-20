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
    
    console.log('DEBUG: Formatted message:', message);
    console.log('DEBUG: Message length:', message ? message.length : 'null/undefined');
    
    // Validate that message is not empty
    if (!message || message.trim().length === 0) {
      console.error('Žinutė negali būti tuščia. VisitorData:', visitorData);
      return;
    }
    
    const data = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });

    console.log('DEBUG: JSON data to send:', data);
    console.log('DEBUG: JSON data length:', data.length);

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
  try {
    const timestamp = new Date().toLocaleString('lt-LT');
    
    // Use array with join to create proper line breaks
    const lines = [
      '<b>🌐 Nauja svetainės vizitas</b>',
      '',
      '<b>⏰ Laikas:</b> ' + timestamp,
      '<b>🌍 IP Adresas:</b> ' + (data?.ip || 'N/A'),
      '<b>🌐 Host:</b> ' + (data?.host || 'N/A'),
      '<b>🔗 Referrer:</b> ' + (data?.referrer || 'Tiesiogiai'),
      '<b>📱 User Agent:</b> ' + (data?.userAgent || 'N/A'),
      '',
      '<b>🖥️ Naršyklė:</b> ' + (data?.browser || 'Nežinoma'),
      '<b>💻 Operacinė sistema:</b> ' + (data?.os || 'Nežinoma'),
      '<b>📲 Įrenginys:</b> ' + (data?.deviceType || 'Nežinoma'),
      '',
      '<b>🌎 Vieta:</b> ' + (data?.country || 'Nežinoma') + ', ' + (data?.city || 'Nežinoma'),
      '<b>🕐 Laiko zonė:</b> ' + (data?.timezone || 'N/A')
    ];
    
    const message = lines.join('\n');
    
    if (!message || message.trim().length === 0) {
      console.warn('Žinutė tuščia, grąžinama numatytoji');
      return '🌐 Nauja svetainės vizita';
    }
    
    console.log('DEBUG: Final message for Telegram:', message);
    return message;
  } catch (error) {
    console.error('Klaida formatuojant žinutę:', error);
    return '🌐 Nauja svetainės vizita';
  }
};

module.exports = {
  sendVisitorInfoToTelegram
};
