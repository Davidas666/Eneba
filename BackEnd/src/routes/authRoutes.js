const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { googleCallback } = require('../controllers/authController');

// Google OAuth login
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    })
);

// Google OAuth callback
router.get('/google/callback', 
    passport.authenticate('google', { session: false }), 
    googleCallback
);

module.exports = router;
