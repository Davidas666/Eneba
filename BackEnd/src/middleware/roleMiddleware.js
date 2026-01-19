const AppError = require('../utils/appError');

/**
 * Restrict access to specific roles
 * Usage: router.get('/admin', protect, restrictTo('admin'), controller)
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'seller', 'buyer')
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user is set by the protect middleware
        if (!req.user) {
            return next(new AppError('You must be logged in to access this resource', 401));
        }

        // req.user.role_name comes from the protect middleware after JWT verification
        if (!roles.includes(req.user.role_name)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        next();
    };
};
