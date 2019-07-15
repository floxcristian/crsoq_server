'use strict'

// ----------------------------------------
// Load modules
// ----------------------------------------
const {
    check
} = require('express-validator/check');

const calendar = [
    check('page')
    .exists().withMessage('Year is a required field.')
    .isInt().withMessage('Year must be an integer.')
    .isLength({min: 4, max:4}).withMessage('Year must be 4 numbers.'),

    check('page_size')
    .exists().withMessage('Semester is a required field.')
    .isInt().withMessage('Semester must be an integer.')
    .isLength({min: 4, max:4}).withMessage('Semester must be 4 numbers.'),

    check('subject'),
    
];

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {
    calendar
}