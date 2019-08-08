'use strict'

// Load modules
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../database');
const index = require('../../index');

function rejectRefreshToken(req, res, next) {

    try {
        const { refresh_token } = req.body;
        index.deleteRefreshToken(refresh_token);
        res.sendStatus(204);
    } catch (error) {
        next({
            error
        });
    }

}

const login = async (req, res, next) => {
    try {

        const {
            email,
            password
        } = req.body;

        const text = `
            SELECT id_user, name, last_name, middle_name, document, email, phone, username, password, active, profile_image, created_at, updated_at 
            FROM users 
            WHERE email = $1`;
        const values = [email];
        const {
            rows
        } = await pool.query(text, values);

        if (rows.length == 0) {
            return res.status(400)
                .send({
                    message: '(email) or password incorrect.',
                });
        }

        let user = rows[0];

        // Compara las passwords
        if (!passwordMatches(password, user.password)) {
            return res.status(400) // UNATHORIZED??
                .send({
                    message: 'email or (password) incorrect.'
                });
        }

        const text2 = `
            SELECT role 
            FROM roles 
            WHERE id_user = $1 
            ORDER BY role`;
        const values2 = [user.id_user];
        const roles = (await pool.query(text2, values2)).rows.map(role => role.role);
        user.roles = roles;

        delete user.password; // Elimina la password del objeto usuario

        let token = generateAccessToken(user);
        let refresh_token = generateRefreshToken(user.id_user); // Mismo usuario puede tener diferentes refresh_tokens?

        // Añadir el 'refresh_token' a la lista en memoria
        addRefreshToken(refresh_token, user.username);

        res.json({
            token,
            refresh_token,
            user
        });

    } catch (error) {
        next({
            error
        });
    }

}

// Renueva la sesión (recibe token)
const updateSession = async (req, res, next) => {
    try {

        const {
            expired_token
        } = req.body;

        let user = req.user_payload;
        let token = req.get('Authorization');

        // Si el token esta por expirar vuelve a generar uno
        if (expired_token) token = generateAccessToken(user);

        res.json({
            token,
            user
        });

    } catch (error) {
        next({
            error
        });
    }
}


// Recibe el 'refresh token' y el 'email'
// 'An email is required to generate an access token.'
const renewToken = async (req, res, next) => {
    
    try {

        const {
            email,
            refresh_token
        } = req.body;

        // Obtiene el user desde la base de datos a partir del 'email'
        const text = `
        SELECT id_user, name, last_name, middle_name, document, email, phone, username, password, active, profile_image, created_at, updated_at 
        FROM users 
        WHERE email = $1`;
        const values = [email];
        const {
            rows
        } = await pool.query(text, values);

        if (rows.length == 0) {
            return res.status(400) //?
                .send({
                    message: 'The email is not valid.',
                });
        }

        let user = rows[0];
        console.log("user: ", user);

        let access_token = generateAccessToken(user);
        let new_refresh_token = generateRefreshToken(user);


        // Si encuentra el 'refresh_token' en memoria crea un nuevo 'access_token' y actualiza el 'refresh_token'
        // Comprobar que existe el refresh token y que tiene el mismo username asociado
        if (true) {

            try {
                const user = jwt.verify(refresh_token, process.env.SEED);
            } catch (error) {

            }



            jwt.verify(refresh_token, process.env.SEED, (error, decoded) => {
                if (error) {
                    return res.status(401)
                        .send({
                            message: 'The refresh token is not valid.'
                        });
                }

                let refresh_token_payload = decoded;

                updateRefreshToken(refresh_token, email);
            });

            // Generar un nuevo token con la info de usuario obtenida de la base de datos
        } else {
            // Si el 'refresh_token' caducó o no se encuentra en memoria
            return res.status(401)
                .send({
                    error: 'The refresh token is invalid'
                });
        }



        res.json({
            token,
            refresh_token,
            user
        });
    } catch (error) {
        next({
            error
        });
    }
}

const generateAccessToken = (user) => {

    // En algunos blogs usan: 'email y username', en otros un 'id_client'.
    return jwt.sign({
        user: user
    }, process.env.SEED, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION
    });

}

/* + Forma es6 de las funciones
const generateAccessToken = data => {
    jwt.sign(data, process.env.SEED, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION });
}
*/


const generateRefreshToken = (id_user) => {

    return jwt.sign({
        id_user: id_user
    }, process.env.SEED, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRATION
    });

}

// Genera un refresh token string (sin JWT)
// + Con el id_client se asegura que nunca se repita
// + Como saber cuando expira este token sin JWT?
const generateRefreshToken2 = (id_client) => {
    return `${id_client.toString()}.${crypto.randomBytes(40).toString('hex')}`;
}

/**
 * Retorna 'true' o 'false' de acuerdo a si las passwords coinciden.
 * @private
 */
async function passwordMatches(valid_password, password) {
    return bcrypt.compareSync(valid_password, password);
}

/**
 * Retorna un objeto formateado con los tokens para el response del cliente
 * @private
 */
function generateTokenResponse(user, access_token) {

    const refresh_token = true;

    // Obtiene la fecha de expiración
    // Obtiene el payload.exp: 
    const expiration = process.env.ACCESS_TOKEN_EXPIRATION * 1000; // Expiración en milisegundos
    const now = Date.now(); // Fecha actual en timestamp/milisegundos
    const expires_in = new Date(now + expiration).toString(); // Fecha a partir del nuevo timestamp

    return {
        access_token,
        refresh_token,
        expires_in
    };

}


function addRefreshToken(refresh_token, username) {

}



function updateRefreshToken(refresh_token, email) {

    // mision: obtener el refresh_token['exp']


    //let now = Math.floor(Date.now()/1000); // Obtiene el tiempo en minutos
    //let time_to_expire = (refresh_token['exp'] - now);

    if (time_to_expire < (60 * 60)) { // Si queda menos de una hora para la expiración actualizo el token

    }

    //return new_refresh_token;

}

module.exports = {
    login,
    updateSession,
    renewToken
}