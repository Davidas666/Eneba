const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { protect } = require('../controllers/authController');
const { restrictTo } = require('../middleware/roleMiddleware');
const { validateCreateGame, validateCreateListing, validate } = require('../validator/game');

// Public marketplace listings
router.get('/list', gameController.getAllListings);

// Public routes
router.get('/games', gameController.getAllGames);
router.get('/games/search', gameController.searchGames);
router.get('/games/:id', gameController.getGameById);

// Helper routes (public)
router.get('/platforms', gameController.getAllPlatforms);
router.get('/regions', gameController.getAllRegions);

// Protected routes - Seller only
router.post(
    '/games',
    protect,
    restrictTo('seller'),
    validateCreateGame,
    validate,
    gameController.createGame
);

router.post(
    '/listings',
    protect,
    restrictTo('seller'),
    validateCreateListing,
    validate,
    gameController.createListing
);

router.get(
    '/my-listings',
    protect,
    restrictTo('seller'),
    gameController.getMyListings
);

router.patch(
    '/listings/:id',
    protect,
    restrictTo('seller'),
    gameController.updateListing
);

router.delete(
    '/listings/:id',
    protect,
    restrictTo('seller'),
    gameController.deleteListing
);

module.exports = router;
