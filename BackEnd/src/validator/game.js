const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

exports.validateCreateGame = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .trim()
        .isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
    
    body('publisher')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Publisher must not exceed 255 characters'),
    
    body('developer')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Developer must not exceed 255 characters'),
    
    body('releaseDate')
        .optional()
        .isISO8601().withMessage('Release date must be a valid date'),
    
    body('imageUrl')
        .optional()
        .isURL().withMessage('Image URL must be a valid URL'),
    
    body('platformIds')
        .optional()
        .isArray().withMessage('Platform IDs must be an array')
        .custom((value) => {
            if (!Array.isArray(value)) return false;
            return value.every(id => typeof id === 'string');
        }).withMessage('Each platform ID must be a valid UUID string')
];

exports.validateCreateListing = [
    body('gameId')
        .notEmpty().withMessage('Game ID is required')
        .isUUID().withMessage('Game ID must be a valid UUID'),
    
    body('platform')
        .notEmpty().withMessage('Platform is required')
        .isString().withMessage('Platform must be a string (name or UUID)'),
    
    body('region')
        .notEmpty().withMessage('Region is required')
        .isString().withMessage('Region must be a string (code like EU, US, GLOBAL or UUID)'),
    
    body('price')
        .notEmpty().withMessage('Price is required')
        .isDecimal({ decimal_digits: '0,2' }).withMessage('Price must be a valid decimal with up to 2 decimal places')
        .custom((value) => parseFloat(value) > 0).withMessage('Price must be greater than 0'),
    
    body('stock')
        .notEmpty().withMessage('Stock is required')
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    
    body('discountPercentage')
        .optional()
        .isDecimal({ decimal_digits: '0,2' }).withMessage('Discount percentage must be a valid decimal')
        .custom((value) => parseFloat(value) >= 0 && parseFloat(value) <= 100).withMessage('Discount percentage must be between 0 and 100')
];

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join('. ');
        return next(new AppError(errorMessages, 400));
    }
    next();
};
