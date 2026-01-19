const { body } = require('express-validator')

const argon2 = require('argon2');
const { getUserByEmail } = require('../models/userModel');

const validateLogin = [
    body('email')
    .notEmpty()
    .withMessage("Emailo reikia jopapa")
    .isEmail()
    .withMessage('Netinkamas email')
    .normalizeEmail()
    .custom(async(value)=>{
        const user = await getUserByEmail(value);

        if(!user){
            throw new Error("User not found,sign up");
        }
        return true;
    }),
    body('password')
    .notEmpty()
    .withMessage("passwordo reikia jopapa")
    .custom(async(value, {req}) =>{
        const user = await getUserByEmail(req.body.email);
        if(user){
            const matchPass = await argon2.verify(user.password, value);
            if(!matchPass){
                throw new Error("password incorect");
            }
            return true;
        }
    }),
];
module.exports = validateLogin;