const https = require('https');

// Telegram bot konfiguracija
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Funkcija siunčianti API info į Telegram
const sendApiActivityToTelegram = async (apiData) => {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Telegram bot token arba chat ID nenustatyti');
      return;
    }

    const message = formatApiMessage(apiData);
    
    if (!message || message.trim().length === 0) {
      console.error('Žinutė negali būti tuščia');
      return;
    }
    
    const data = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });

    // Use Buffer.byteLength for correct Content-Length with emoji/UTF-8
    const contentLength = Buffer.byteLength(data, 'utf8');

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': contentLength
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
            resolve(true);
          } else {
            reject(new Error(responseData));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Klaida siunčiant API activity į Telegram:', error.message);
        reject(error);
      });

      req.write(data);
      req.end();
    });
  } catch (error) {
    console.error('Klaida siunčiant API activity į Telegram:', error.message);
  }
};

// Funkcija formatuojanti API žinutę
const formatApiMessage = (data) => {
  try {
    const timestamp = new Date().toLocaleString('lt-LT');
    
    // Paslėpti jautrūs duomenys
    let bodyPreview = 'N/A';
    if (data.body) {
      const bodyStr = JSON.stringify(data.body);
      // Maskuoti slaptažodžius ir email'us
      bodyPreview = bodyStr
        .replace(/"password":"[^"]*"/g, '"password":"***"')
        .replace(/"email":"[^"]*"/g, '"email":"***"')
        .substring(0, 100);
    }

    const statusEmoji = data.status >= 200 && data.status < 300 ? '✅' : 
                       data.status >= 400 && data.status < 500 ? '⚠️' : '❌';

    const lines = [
      `<b>📡 API Kvietimas</b>`,
      '',
      `<b>🕐 Laikas:</b> ${timestamp}`,
      `<b>🔗 Endpoint:</b> <code>${data.method} ${data.url}</code>`,
      `<b>📊 Status:</b> ${statusEmoji} ${data.status}`,
      `<b>🌍 IP:</b> ${data.ip}`,
      `<b>🔍 User Agent:</b> ${data.userAgent || 'N/A'}`,
      `<b>⏱️ Laikas ms:</b> ${data.duration}ms`
    ];

    if (bodyPreview !== 'N/A') {
      lines.push(`<b>📦 Body:</b> <code>${bodyPreview}</code>`);
    }

    return lines.join('\n');
  } catch (error) {
    console.error('Klaida formatuojant API žinutę:', error);
    return '📡 API Activity';
  }
};

// Middleware kuris trackina API activity
const apiActivityMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Išsaugom originalų res.json metodą
  const originalJson = res.json;
  
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Gauti tikrą IP adresą
    const ip = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress;

    const apiData = {
      method: req.method,
      url: req.path,
      status: res.statusCode,
      ip: ip?.split(',')[0]?.trim() || ip,
      userAgent: req.headers['user-agent'] || 'N/A',
      duration: duration,
      body: req.body,
      timestamp: new Date().toISOString()
    };

    // Siųsti į Telegram (bet ne skirting timeout, kad neuzkemš serverio)
    setTimeout(() => {
      sendApiActivityToTelegram(apiData).catch(err => {
        console.error('Nepavyko siųsti API activity į Telegram:', err.message);
      });
    }, 0);

    // Iškviesti originalų json metodą
    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  sendApiActivityToTelegram,
  apiActivityMiddleware
};
