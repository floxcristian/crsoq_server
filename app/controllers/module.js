'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const pool = require('../database');

async function getModules(req, res, next) {
    try {
        const {
            id_course,
        } = req.query;

        console.log(`id_course: ${id_course}`);
        if (id_course) {
            const text = `SELECT id_module, id_course, name, position, created_at, updated_at FROM modules WHERE id_course = $1`;
            const values = [id_course];
            const {
                rows
            } = await pool.query(text, values);
            //const total_items = rows.length != 0 ? rows[0].count : 0;
            res.json(rows)
        } else {
            res.status(400).json({
                message: 'send all necessary fields'
            })
        }

    } catch (error) {
        next({ error });
    }
}

// ----------------------------------------
// Get Modules as Select Options
// ----------------------------------------
async function getModuleOptions(req, res, next) {
    try {
        // Query Params
        const id_course = req.query.id_course; // Required  

        // Obtiene los Modulos
        const text = 'SELECT id_module, name FROM modules WHERE id_course = $1';
        const values = [id_course];
        const { rows } = await pool.query(text, values);

        // Envía la Respuesta
        res.json(rows);
    } catch (error) {
        next({ error });
    }
}

// ----------------------------------------
// Create Module
// ----------------------------------------
async function createModule(req, res) {

    try {
        const {
            id_course,
            name
        } = req.body;

        if (id_course, name) {

            const {
                rows
            } = await pool.query('INSERT INTO modules(id_course, name) VALUES($1, $2)', [id_course, name]);
            res.json({
                message: 'successfully created module'
            })

        } else {
            res.status(400).json({
                message: 'send all necessary fields'
            })
        }
    } catch (error) {
        next({ error });
    }
}

// ----------------------------------------
// Elimina un Modulo
// ----------------------------------------
async function deleteModule(req, res) {
    try {
        // Params
        const id_module = req.params.moduleId;

        const text = 'DELETE FROM modules WHERE id_module = $1';
        const values = [id_module];
        const {
            rows
        } = await pool.query(text, values);
        res.sendStatus(204);

    } catch (error) {
        next({ error });
    }
}


// ----------------------------------------
// Actualiza un Modulo
// ----------------------------------------
async function updateModule(req, res) {
    try {
        const id_module = req.params.moduleId;
        // Body Params
        const {
            name
        } = req.body;

        const text = 'UPDATE modules SET name = $1 WHERE id_module = $2 RETURNING id_module, id_course, name, position, created_at, updated_at';
        const values = [name, id_module];
        const { rows } = await pool.query(text, values);

        // Envía la Respuesta
        res.json(rows[0])
    } catch (error) {
        next({ error });
    }
}

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {
    getModules,
    getModuleOptions,
    createModule,
    deleteModule,
    updateModule
}