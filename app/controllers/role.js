'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const pool = require('../database');

// ----------------------------------------
// Get Roles
// ----------------------------------------
async function getRoles(req, res) {
    try {
        const text = 'SELECT * FROM role';
        const { rows } = await pool.query(text);
        res.json(rows)
    } catch (error) {
        next({ error });
    }
}

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {
    getRoles
}