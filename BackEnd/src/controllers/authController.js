const argon2 = require("argon2");
const { 
    createUser, 
    getUserByEmail, 
    getUserById,
    getRoleIdByName,
    createUserBalance,
    createUserCart
} = require('../models/userModel');
const AppError = require("../utils/appError");
const jwt = require('jsonwebtoken');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const sendTokenCookie = (token, res) => {
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };
    res.cookie('jwt', token, cookieOptions);
};

// User signup
exports.signup = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, role = 'buyer' } = req.body;

        if (role && role.toLowerCase() === 'admin') {
            return next(new AppError('Cannot create admin users through registration. Admin accounts can only be created via system scripts.', 403));
        }

        const allowedRoles = ['buyer', 'seller'];
        const userRole = role && allowedRoles.includes(role.toLowerCase()) ? role.toLowerCase() : 'buyer';

        // Get role ID
        const roleId = await getRoleIdByName(userRole);
        if (!roleId) {
            return next(new AppError("Invalid role", 400));
        }

        // Hash password
        const hashedPassword = await argon2.hash(password);

        // Create user
        const createdUser = await createUser({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            roleId
        });

        if (!createdUser) {
            return next(new AppError("User not created", 400));
        }

        // Create user balance (0.00)
        await createUserBalance(createdUser.id);

        // Create user cart
        await createUserCart(createdUser.id);

        // Generate token
        const token = signToken(createdUser.id);
        sendTokenCookie(token, res);

        // Remove password from response
        const userResponse = {
            id: createdUser.id,
            email: createdUser.email,
            firstName: createdUser.first_name,
            lastName: createdUser.last_name,
            role: userRole
        };

        res.status(201).json({
            status: "success",
            data: userResponse,
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if email and password exist
        if (!email || !password) {
            return next(new AppError("Please provide email and password", 400));
        }

        const user = await getUserByEmail(email);
        
        // Check if user exists
        if (!user) {
            return next(new AppError("Incorrect email or password", 401));
        }

        // Verify password
        const isPasswordCorrect = await argon2.verify(user.password, password);
        if (!isPasswordCorrect) {
            return next(new AppError("Incorrect email or password", 401));
        }
        
        // Check if account is active
        if (!user.is_active) {
            return next(new AppError("Account is deactivated", 403));
        }

        const token = signToken(user.id);
        sendTokenCookie(token, res);

        const userResponse = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role_name
        };

        res.status(200).json({
            status: "success",
            data: { user: userResponse },
        });
    } catch (error) {
        next(error);
    }
};

exports.protect = async (req, res, next) => {
    try {
        let token = req.cookies?.jwt;

        if (!token) {
            return next(
                new AppError(
                    "You are not logged in. Please log in to access this page.",
                    401
                )
            );
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const currentUser = await getUserById(decoded.id);
        if (!currentUser) {
            return next(
                new AppError(
                    "The user belonging to this token does no longer exist.",
                    401
                )
            );
        }

        // Check if account is active
        if (!currentUser.is_active) {
            return next(new AppError("Your account has been deactivated.", 403));
        }

        req.user = currentUser;
        next(); 
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token has expired', 401));
        }
        next(error);
    }
};

exports.allowAccessTo = (...roles) => {
    return (req, res, next) => {
        try {
            if (!roles.includes(req.user.role_name)) {
                throw new AppError(
                    `You do not have permission to perform this action`,
                    403
                );
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

exports.logout = (req, res) => {
    return res.clearCookie('jwt').status(200).json({
        status: 'success',
        message: 'User logged out successfully',
    });
};

// Google OAuth Callback
exports.googleCallback = async (req, res, next) => {
    try {
        // User is already authenticated by passport
        const user = req.user;
        
        console.log('Google OAuth successful for user:', user.email);
        
        // Generate JWT token
        const token = signToken(user.id);
        
        // Send token as cookie (for security)
        sendTokenCookie(token, res);
        
        // Redirect to frontend with token in URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectUrl = `${frontendUrl}/?token=${token}`;
        
        console.log('Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Google OAuth error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth?error=authentication_failed`);
    }
};

// Get current user (for OAuth and regular auth)
exports.getCurrentUser = async (req, res, next) => {
    try {
        const user = await getUserById(req.user.id);
        
        res.status(200).json({
            status: 'success',
            data: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role_name
            }
        });
    } catch (error) {
        next(error);
    }
};