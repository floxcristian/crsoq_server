'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const {
    check
} = require('express-validator/check');


module.exports = {
    calendar: [
        check('year')
            .exists().withMessage('Year is a required field.')
            .isInt().withMessage('Year must be an integer.')
            .isLength({ min: 4, max: 4 }).withMessage('Year must be 4 numbers.'),

        check('semester')
            .exists().withMessage('Semester is a required field.')
            .isInt().withMessage('Semester must be an integer.')
            .isLength({ min: 1, max: 10 }).withMessage('Semester must be 4 numbers.'),
    ],
    errorFormatter: ({
        location,
        msg,
        param,
        value,
        nestedErrors
    }) => {
        return {
            location: location,
            message: msg,
            param: param,
            value: value,
            debug_id: 222,
            nestedErrors: nestedErrors,
        }
    }
}

// ----------------------------------------
// Export Modules
// ----------------------------------------