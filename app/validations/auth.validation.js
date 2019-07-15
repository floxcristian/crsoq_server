'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const check = require('express-validator/check').check;


const login = [
    check('email')
    .exists().withMessage('email is a required field.')
    .isLength({min: 6, max:25}).withMessage('Year must be at least 6 numbers.'),

    check('password')
    .exists().withMessage('password is a required field.')
    .isLength({min: 4, max:4}).withMessage('Semester must be at least 4 numbers.'),
];

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {
    login
}