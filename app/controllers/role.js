'use strict'

// Load modules
const pool = require('../database');

// Get roles
const getRoles = async (req, res, next) => {
    try {
        const text = `
            SELECT * 
            FROM roles`;
        const { rows } = await pool.query(text);
        res.json(rows)
    } catch (error) {
        next({ error });
    }
}

module.exports = {
    getRoles
}