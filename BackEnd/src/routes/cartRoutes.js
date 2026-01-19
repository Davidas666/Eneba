const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../controllers/authController');
const { restrictTo } = require('../middleware/roleMiddleware');
const { body } = require('express-validator');
const validate = require('../validator/validate');

// All routes require authentication and buyer role
router.use(protect);
router.use(restrictTo('buyer'));

// Get user's cart
router.get('/cart', cartController.getCart);

// Add item to cart
router.post(
    '/cart',
    [
        body('listingId')
            .notEmpty().withMessage('Listing ID is required')
            .isUUID().withMessage('Listing ID must be a valid UUID'),
        body('quantity')
            .optional()
            .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    ],
    validate,
    cartController.addToCart
);

// Update item quantity
router.patch(
    '/cart/:listingId',
    [
        body('quantity')
            .notEmpty().withMessage('Quantity is required')
            .isInt({ min: 0 }).withMessage('Quantity must be 0 or greater')
    ],
    validate,
    cartController.updateCartItem
);

// Remove item from cart
router.delete('/cart/:listingId', cartController.removeFromCart);

// Clear entire cart
router.delete('/cart', cartController.clearCart);

module.exports = router;
