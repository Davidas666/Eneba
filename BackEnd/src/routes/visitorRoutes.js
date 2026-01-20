const express = require('express');
const router = express.Router();
const { sendVisitorInfoToTelegram } = require('../services/visitorTracker');

// Endpoinas priimantis lankytojo informaciją
router.post('/track-visitor', async (req, res) => {
  try {
    const visitorData = req.body;
    
    // Gauti tikrą IP adresą (jei yra proxy)
    const ip = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress;

    const completeVisitorData = {
      ...visitorData,
      ip: ip?.split(',')[0]?.trim() || ip,
      timestamp: new Date().toISOString()
    };

    // Siųsti į Telegram
    await sendVisitorInfoToTelegram(completeVisitorData);

    res.json({ 
      success: true, 
      message: 'Duomenys sėkmingai gauti' 
    });
  } catch (error) {
    console.error('Klaida priimant lankytojo duomenis:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
