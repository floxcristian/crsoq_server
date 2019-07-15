'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const moment = require('moment');
const SECRET = 'secret_string_crsoq';

// ----------------------------------------
// Create Token Function
// ----------------------------------------
function createToken(user) {
    var payload = {
        sub: user._id,
        name: user.name,
        last_name: user.last_name,
        middle_name: user.middle_name,
        email: user.email,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix()
    }
    return jwt.encode(payload, SECRET)
};

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {
    createToken
}