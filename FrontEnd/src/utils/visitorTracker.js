// Lankytojo sekimo skriptas
(function() {
  // Nustatyti backend URL
  const API_URL = 'https://api.davidas.pro'; // Gamybos URL

  // Funkcija gauti naršyklės informaciją
  function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Nežinoma';
    let os = 'Nežinoma';
    let deviceType = 'Desktop';

    // Nustatyti naršyklę
    if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else if (ua.indexOf('Edge') > -1) browser = 'Edge';
    else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';

    // Nustatyti OS
    if (ua.indexOf('Windows') > -1) os = 'Windows';
    else if (ua.indexOf('Mac') > -1) os = 'macOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iPhone') > -1) os = 'iOS';

    // Nustatyti įrenginio tipą
    if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) {
      deviceType = 'Mobile';
    } else if (/Tablet|iPad/.test(ua)) {
      deviceType = 'Tablet';
    }

    return {
      browser,
      os,
      deviceType,
      userAgent: ua,
      referrer: document.referrer || 'Tiesiogiai',
      host: window.location.hostname,
      url: window.location.href,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Funkcija gauti IP adresą
  async function getIPInfo() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        ip: data.ip,
        country: data.country_name,
        city: data.city,
        timezone: data.timezone
      };
    } catch (error) {
      console.warn('Negalėjo gauti IP informacijos:', error);
      return {
        ip: 'N/A',
        country: 'N/A',
        city: 'N/A',
        timezone: 'N/A'
      };
    }
  }

  // Pagrindinė funkcija
  async function trackVisitor() {
    try {
      const browserInfo = getBrowserInfo();
      const ipInfo = await getIPInfo();

      const visitorData = {
        ...browserInfo,
        ...ipInfo
      };

      // Siųsti į backend
      await fetch(`${API_URL}/api/visitor/track-visitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visitorData)
      });

      console.log('Lankytojo duomenys sėkmingai išsiųsti');
    } catch (error) {
      console.error('Klaida siunčiant lankytojo duomenis:', error);
    }
  }

  // Palaukti kol puslapis visiškai įkrauta
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackVisitor);
  } else {
    trackVisitor();
  }
})();
