const gameModel = require('../models/gameModel');
const AppError = require('../utils/appError');

// Get all listings (marketplace view)
exports.getAllListings = async (req, res, next) => {
    try {
        const search = req.query.search || null;
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const listings = await gameModel.getAllListings(search, limit, offset);

        res.status(200).json({
            status: 'success',
            results: listings.length,
            data: { listings }
        });
    } catch (error) {
        next(error);
    }
};

// Create a new game (base product)
exports.createGame = async (req, res, next) => {
    try {
        const { title, description, publisher, developer, releaseDate, imageUrl, platformIds } = req.body;

        const game = await gameModel.createGame({
            title,
            description,
            publisher,
            developer,
            releaseDate,
            imageUrl,
            platformIds
        });

        res.status(201).json({
            status: 'success',
            data: { game }
        });
    } catch (error) {
        next(error);
    }
};

// Create a listing for a game
exports.createListing = async (req, res, next) => {
    try {
        const { gameId, platform, region, price, stock, discountPercentage = 0 } = req.body;
        const sellerId = req.user.id; // From protect middleware

        // Verify game exists
        const game = await gameModel.getGameById(gameId);
        if (!game) {
            return next(new AppError('Game not found', 404));
        }

        // Resolve platform (accepts UUID, name, or code)
        const platformData = await gameModel.findPlatform(platform);
        if (!platformData) {
            return next(new AppError(`Platform '${platform}' not found`, 404));
        }

        // Resolve region (accepts UUID, name, or code)
        const regionData = await gameModel.findRegion(region);
        if (!regionData) {
            return next(new AppError(`Region '${region}' not found`, 404));
        }

        const listing = await gameModel.createListing({
            gameId,
            sellerId,
            platformId: platformData.id,
            regionId: regionData.id,
            price,
            stock,
            discountPercentage
        });

        res.status(201).json({
            status: 'success',
            data: { listing }
        });
    } catch (error) {
        next(error);
    }
};

// Get all games
exports.getAllGames = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const games = await gameModel.getAllGames(limit, offset);

        res.status(200).json({
            status: 'success',
            results: games.length,
            data: { games }
        });
    } catch (error) {
        next(error);
    }
};

// Get game by ID with listings
exports.getGameById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const game = await gameModel.getGameById(id);
        if (!game) {
            return next(new AppError('Game not found', 404));
        }

        const listings = await gameModel.getGameListings(id);

        res.status(200).json({
            status: 'success',
            data: {
                game,
                listings
            }
        });
    } catch (error) {
        next(error);
    }
};

// Search games
exports.searchGames = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return next(new AppError('Search query is required', 400));
        }

        const games = await gameModel.searchGames(q);

        res.status(200).json({
            status: 'success',
            results: games.length,
            data: { games }
        });
    } catch (error) {
        next(error);
    }
};

// Get seller's own listings
exports.getMyListings = async (req, res, next) => {
    try {
        const sellerId = req.user.id;

        const listings = await gameModel.getSellerListings(sellerId);

        res.status(200).json({
            status: 'success',
            results: listings.length,
            data: { listings }
        });
    } catch (error) {
        next(error);
    }
};

// Update listing
exports.updateListing = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sellerId = req.user.id;
        const { price, stock, discountPercentage, isActive } = req.body;

        const listing = await gameModel.updateListing(id, sellerId, {
            price,
            stock,
            discountPercentage,
            isActive
        });

        if (!listing) {
            return next(new AppError('Listing not found or you do not have permission', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { listing }
        });
    } catch (error) {
        next(error);
    }
};

// Delete listing
exports.deleteListing = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sellerId = req.user.id;

        const listing = await gameModel.deleteListing(id, sellerId);

        if (!listing) {
            return next(new AppError('Listing not found or you do not have permission', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

// Get all platforms (helper)
exports.getAllPlatforms = async (req, res, next) => {
    try {
        const platforms = await gameModel.getAllPlatforms();

        res.status(200).json({
            status: 'success',
            results: platforms.length,
            data: { platforms }
        });
    } catch (error) {
        next(error);
    }
};

// Get all regions (helper)
exports.getAllRegions = async (req, res, next) => {
    try {
        const regions = await gameModel.getAllRegions();

        res.status(200).json({
            status: 'success',
            results: regions.length,
            data: { regions }
        });
    } catch (error) {
        next(error);
    }
};
