const favoriteModel = require('../models/favoriteModel');
const AppError = require('../utils/appError');

// Add listing to favorites
exports.addFavorite = async (req, res, next) => {
    try {
        const { listingId } = req.body;
        const userId = req.user.id;

        const favorite = await favoriteModel.addToFavorites(userId, listingId);

        res.status(201).json({
            status: 'success',
            message: 'Listing added to favorites',
            data: { favorite }
        });
    } catch (error) {
        if (error.message === 'Listing not found') {
            return next(new AppError('Listing not found', 404));
        }
        next(error);
    }
};

// Remove listing from favorites
exports.removeFavorite = async (req, res, next) => {
    try {
        const { listingId } = req.params;
        const userId = req.user.id;

        const favorite = await favoriteModel.removeFromFavorites(userId, listingId);

        if (!favorite) {
            return next(new AppError('Listing not found in favorites', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Listing removed from favorites',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

// Get user's favorites
exports.getFavorites = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const favorites = await favoriteModel.getUserFavorites(userId);

        res.status(200).json({
            status: 'success',
            results: favorites.length,
            data: { favorites }
        });
    } catch (error) {
        next(error);
    }
};

// Check if listing is favorite
exports.checkFavorite = async (req, res, next) => {
    try {
        const { listingId } = req.params;
        const userId = req.user.id;

        const isFavorite = await favoriteModel.isFavorite(userId, listingId);

        res.status(200).json({
            status: 'success',
            data: { isFavorite }
        });
    } catch (error) {
        next(error);
    }
};
