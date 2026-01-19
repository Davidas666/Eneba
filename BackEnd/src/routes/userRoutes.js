const express = require('express');
const { signup, login, protect, logout, getCurrentUser } = require('../controllers/authController.js');
const validate = require('../validator/validate.js');
const validateNewUser = require('../validator/signup.js');
const validateLogin = require('../validator/login.js');
const router = express.Router();

router.route('/signup').post(validateNewUser, validate, signup);
router.route('/login').post(validateLogin, validate, login);
router.route('/logout').get(protect, logout);
router.route('/profile').get(protect, getCurrentUser);

module.exports = router;