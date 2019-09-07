'use strict'

// Load modules
const pool = require('../database');

// Obtiene todos los colores
const getColors = async (req, res, next) => {
    try {
        const text = `
            SELECT id_color, name, hexadecimal 
            FROM colors 
            ORDER BY name ASC`;
        const {
            rows
        } = await pool.query(text);
        res.json(rows);
    } catch (error) {
        next({ error });
    }
}

// Obtiene los colores por 'id_user'
const getColorsByUserId = async (req, res, next) => {

    try {
        const { id_user } = req.params;

        const text = `
            SELECT id_color, name, haxadecimal 
            FROM colors 
            WHERE id_color 
            IN (
                SELECT id_color 
                FROM user_subject_color 
                WHERE id_user = $1
            )`;
        const values = [id_user];
        const {
            rows
        } = await pool.query(text, values);
        res.json(rows);
    } catch (error) {
        next({ error });
    }
}

// Crea un color
const createColor = async (req, res, next) => {

    try {
        const {
            name,
            hexadecimal
        } = req.body;

        if (name && hexadecimal) {

            let color_exist = await checkColorExists(name, hexadecimal);
            if (color_exist) {
                color_exist.success = false;
                return res.status(500).json(color_exist)
            }

            const text = `
                INSERT INTO colors(name, hexadecimal) 
                VALUES(lower($1), upper($2)) 
                RETURNING id_color, name, hexadecimal`;
            const values = [name, hexadecimal];
            const {
                rows
            } = await pool.query(text, values);
            res.json({
                message: 'successfully created color',
                color: rows[0]
            });

        } else {
            res.status(400).json({
                message: 'send all necessary fields'
            });
        }
    } catch (error) {
        next({ error });
    }
}

// Actualiza un color
const updateColor = async (req, res, next) => {
    try {
        const { id_color } = req.params;
        const {
            name,
            hexadecimal
        } = req.body;

        if (name && hexadecimal) {
            let color_exist = await checkColorExists(name, hexadecimal);
            if (color_exist) {
                color_exist.success = false;
                return res.status(500).json(color_exist)
            }

            const text = `
                UPDATE colors SET name = lower($1), hexadecimal = upper($2) 
                WHERE id_color = $3 
                RETURNING id_color, name, hexadecimal`;
            const values = [name, hexadecimal, id_color];
            const {
                rows
            } = await pool.query(text, values);

            if (rows.length > 0) {
                res.json({
                    message: 'successfully updated color',
                    color: rows[0]
                });
            } else {
                res.status(500).json({
                    message: 'this color does not exist'
                });
            }

        } else {
            res.status(400).json({
                message: 'send all necessary fields'
            })
        }
    } catch (error) {
        next({ error });
    }
}

// Elimina un color
const deleteColor = async (req, res, next) => {
    try {
        const { id_color } = req.params;

        const text = `
            DELETE FROM colors 
            WHERE id_color = $1`;
        const values = [id_color];
        await pool.query(text, values);
        res.sendStatus(204);
    } catch (error) {
        next({ error });
    }
}

// =====================================================
// Chequea si el nombre o hexadecimal del COLOR existe
// =====================================================
const checkColorExists = (name, hexadecimal) => {
    return new Promise(async (resolve, reject) => {
        try {
            const text1 = `
                SELECT id_color 
                FROM colors 
                WHERE name = lower($1)`;
            const values1 = [name];

            const text2 = `
                SELECT id_color 
                FROM colors 
                WHERE hexadecimal = upper($1)`;
            const values2 = [hexadecimal];
            
            const result_search = await Promise.all([
                pool.query(text1, values1),
                pool.query(text2, values2)
            ]);
            const rows_name = result_search[0].rows;
            const rows_hexadecimal = result_search[1].rows;

            let combination = `${rows_name.length}${rows_hexadecimal.length}`;

            switch (combination) {
                case '11':
                    return resolve({
                        status: '11',
                        message: `this name and hexadecimal has been taken`
                    })
                case '10':
                    return resolve({
                        status: '10',
                        message: `this name has been taken`
                    })
                case '01':
                    return resolve({
                        status: '01',
                        message: `this hexadecimal has been taken`
                    })
                default:
                    return resolve(null);
            }
        } catch (error) {
            return reject(error);
        }
    })

}

module.exports = {
    getColors,
    getColorsByUserId,
    createColor,
    updateColor,
    deleteColor
}