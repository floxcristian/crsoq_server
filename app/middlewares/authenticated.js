'use strict'

// Load modules
const jwt = require('jsonwebtoken');
const pool = require('../database');

// Verifica si el token es válido
let checkToken = (req, res, next) => {

    let token = req.headers['authorization'];

    // Si el token no esta en los headers
    if (!token) {
        return res.status(403)
            .send({
                message: 'The request does not have the authentication header.'
            });
    }

    jwt.verify(token, process.env.SEED, (error, decoded) => {

        if (error) {

            // Si el token ha expirado
            if (error.name === 'TokenExpiredError') {
                return res.status(401).send({
                    message: 'The access token has expired.'
                });
            }

            return res.status(401)
                .send({
                    message: 'The access token is invalid.'
                });

        }

        req.token = token;
        req.user_payload = decoded.user;
        next();
    });

}

// Check Role
async function checkAdminRole(req, res, next) {

    let role = 1;

    try {

        let user = req.user_payload;
        const text = `
        SELECT role 
        FROM roles 
        WHERE id_user = $1 
        AND role = $2`;
        const values = [1]

        const result = await pool.query(text, values);
        if (result) {
            return res.status(403)
                .send({
                    message: 'You are not an admin user.'
                });
        }
        next();

    } catch (error) {
        next({
            error
        });
    }

}

// Export modules
module.exports = {
    checkToken,
    checkAdminRole
}