'use strict'

// ----------------------------------------
// Load modules
// ----------------------------------------
const validationResult = require('express-validator/check').validationResult;

// ----------------------------------------
// Check Result Validation
// ----------------------------------------
function checkResult(req, res, next) {

    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        // next({
        //     status: 400,
        //     json: {
        //         name: 'VALIDATION ERROR',
        //         details: errors.array({ onlyFirstError: true })
        //     }
        // })

        // next({error})

        // next({status: 400, error: error , message: ''})

        return res.status(400).json({
            name: 'VALIDATION ERROR',
            details: errors.array({
                onlyFirstError: true
            })
        });
    } else {
        next();
    }
}

// ----------------------------------------
// Error Formatter
// ----------------------------------------
const errorFormatter = ({
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

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {
    checkResult
};