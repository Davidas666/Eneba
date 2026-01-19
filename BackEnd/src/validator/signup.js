const { body } = require('express-validator');
const { getUserByEmail, getRoleIdByName } = require('../models/userModel');

const validateNewUser = [
    body('email')
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail()
        .custom(async(value) => {
            const user = await getUserByEmail(value);
            if (user) {
                throw new Error("User with this email already exists");
            }
            return true;
        }),
    body('password')
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('firstName')
        .notEmpty()
        .withMessage("First name is required")
        .trim()
        .isLength({ max: 100 })
        .withMessage('First name is too long'),
    body('lastName')
        .notEmpty()
        .withMessage("Last name is required")
        .trim()
        .isLength({ max: 100 })
        .withMessage('Last name is too long'),
    body('role')
        .optional()
        .isIn(['buyer', 'seller'])
        .withMessage('Role must be either "buyer" or "seller"')
        .custom(async(value) => {
            const roleId = await getRoleIdByName(value || 'buyer');
            if (!roleId) {
                throw new Error("Invalid role");
            }
            return true;
        })
];

module.exports = validateNewUser;
