const cartModel = require('../models/cartModel');
const { sql } = require('../../dbConnection');
const AppError = require('../utils/appError');

// Get user's cart
exports.getCart = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const cart = await cartModel.getCartWithItems(userId);

        res.status(200).json({
            status: 'success',
            data: {
                cart: {
                    items: cart.items,
                    summary: {
                        itemCount: cart.itemCount,
                        totalQuantity: cart.totalQuantity,
                        total: parseFloat(cart.total.toFixed(2)),
                        totalCashback: cart.totalCashback
                    }
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Add item to cart
exports.addToCart = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { listingId, quantity = 1 } = req.body;

        // Verify listing exists and has stock
        const [listing] = await sql`
            SELECT * FROM game_listings
            WHERE id = ${listingId} AND is_active = true
        `;

        if (!listing) {
            return next(new AppError('Listing not found or is not active', 404));
        }

        if (listing.stock < quantity) {
            return next(new AppError(`Not enough stock. Only ${listing.stock} available`, 400));
        }

        const item = await cartModel.addItemToCart(userId, listingId, quantity);

        res.status(201).json({
            status: 'success',
            message: 'Item added to cart',
            data: { item }
        });
    } catch (error) {
        next(error);
    }
};

// Update item quantity
exports.updateCartItem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { listingId } = req.params;
        const { quantity } = req.body;

        if (quantity < 0) {
            return next(new AppError('Quantity cannot be negative', 400));
        }

        // Verify stock
        const [listing] = await sql`
            SELECT * FROM game_listings
            WHERE id = ${listingId}
        `;

        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        if (quantity > listing.stock) {
            return next(new AppError(`Not enough stock. Only ${listing.stock} available`, 400));
        }

        const item = await cartModel.updateItemQuantity(userId, listingId, quantity);

        res.status(200).json({
            status: 'success',
            message: quantity === 0 ? 'Item removed from cart' : 'Cart updated',
            data: { item }
        });
    } catch (error) {
        next(error);
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { listingId } = req.params;

        const item = await cartModel.removeItemFromCart(userId, listingId);

        if (!item) {
            return next(new AppError('Item not found in cart', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Item removed from cart',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

// Clear cart
exports.clearCart = async (req, res, next) => {
    try {
        const userId = req.user.id;

        await cartModel.clearCart(userId);

        res.status(200).json({
            status: 'success',
            message: 'Cart cleared',
            data: null
        });
    } catch (error) {
        next(error);
    }
};
