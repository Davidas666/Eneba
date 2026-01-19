const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { protect } = require('../controllers/authController');
const { body } = require('express-validator');
const validate = require('../validator/validate');

// All routes require authentication
router.use(protect);

// Get user's favorites
router.get('/favorites', favoriteController.getFavorites);

// Add listing to favorites
router.post(
    '/favorites',
    [
        body('listingId')
            .notEmpty().withMessage('Listing ID is required')
            .isUUID().withMessage('Listing ID must be a valid UUID')
    ],
    validate,
    favoriteController.addFavorite
);

// Check if listing is favorite
router.get('/favorites/:listingId/check', favoriteController.checkFavorite);

// Remove listing from favorites
router.delete('/favorites/:listingId', favoriteController.removeFavorite);

module.exports = router;
