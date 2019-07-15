'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const pool = require('../database');

// ----------------------------------------
// Get Categories
// ----------------------------------------
async function getSubcategories(req, res, next) {
    try {
        // Query Params
        const id_user = req.query.id_user; // Obligatorio
        const id_subject = req.query.id_subject || null;
        const id_category = req.query.id_category || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        // Obtiene las subcategorias
        const text = `SELECT su.id_subject, su.name AS subject, c.id_category, c.name AS category, s.id_subcategory, s.name, s.created_at, s.updated_at 
        FROM subcategories AS s 
        INNER JOIN categories AS c 
        ON s.id_category = c.id_category 
        INNER JOIN subjects AS su 
        ON su.id_subject = c.id_subject 
        WHERE c.id_user = $1 
        AND ($2::int IS NULL OR c.id_subject = $2)
        AND ($3::int IS NULL OR c.id_category = $3)
        ORDER BY s.updated_at DESC 
        LIMIT $4
        OFFSET $5`;
        const values = [id_user, id_subject, id_category, page_size, from];
        const { rows } = await pool.query(text, values);

        // Obtiene la cantidad total de clases (de acuerdo a los parámetros de filtro) ARREGLAR WOM!!
        const text2 = `
        SELECT count(*) 
        FROM categories 
        WHERE id_user = $1
        AND ($2::int IS NULL OR id_subject = $2)`;
        const values2 = [id_user, id_subject];
        //const total_items = (await pool.query(text2, values2)).rows[0].count;

        // Envía la respuesta al cliente
        res.json({
            info: {
                //total_pages: Math.ceil(total_items / page_size),
                page: page,
                page_size: page_size,
                //total_items: parseInt(total_items),
            },
            items: rows
        })
    } catch (error) {
        next({ error });
    }
}

// ----------------------------------------
// Get Categories as Select Options
// ----------------------------------------
async function getSubcategoryOptions(req, res, next) {
    try {
        // Query Params
        //const id_user = req.query.id_user; // Obligatorio por ahora    
        const id_category = req.query.id_category; // Obligatorio por ahora  

        // Obtiene las categorías
        const text = 'SELECT id_subcategory, name FROM subcategories WHERE id_category = $1 ORDER BY name';
        const values = [id_category];
        const { rows } = await pool.query(text, values);

        // Envía la respuesta al cliente
        res.json(rows);
    } catch (error) {
        next({ error });
    }
}

async function createSubcategory(req, res, next) {

    try {
        const {
            id_category,
            name
        } = req.body;

        if (id_category && name) {

            const {
                rows
            } = await pool.query('INSERT INTO subcategories(id_category, name) VALUES($1, $2)', [id_category, name]);
            res.status(201).send(rows[0])
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
// Update Category
// ----------------------------------------
async function updateSubcategory(req, res, next) {
    try {
        const id_subcategory = req.params.subcategoryId;
        const {
            id_category,
            name
        } = req.body;

        // Comprobar si existe el registro antes??
        const text2 = 'UPDATE subcategories SET id_category = $1, name = $2, updated_at = NOW() WHERE id_subcategory = $3';
        const values2 = [id_category, name, id_subcategory];
        const res2 = (await pool.query(text2, values2)).rows[0];

        res.json(res2)

    } catch (error) {
        next({ error });
    }
}

// ----------------------------------------
// Delete Subcategory
// ----------------------------------------
async function deleteSubcategory(req, res, next) {
    try {
        const id_subcategory = req.params.subcategoryId;

        const text = 'DELETE FROM subcategories WHERE id_subcategory = $1';
        const values = [id_subcategory]
        const { rows } = await pool.query(text, values);
        res.sendStatus(204);

    } catch (error) {
        next({ error });
    }
}


async function getLastSubcategories(req, res, next) {

    try {
        const id_user = req.query.id_user; 
        const page_size = req.query.page_size || null;

        const text = `SELECT su.id_subject, su.name AS subject, c.id_category, c.name AS category, s.id_subcategory, s.name, s.created_at, s.updated_at 
        FROM subcategories AS s 
        INNER JOIN categories AS c 
        ON s.id_category = c.id_category 
        INNER JOIN subjects AS su 
        ON su.id_subject = c.id_subject 
        WHERE c.id_user = $1 
        AND s.name != 'DEFAULT'
        ORDER BY s.updated_at DESC 
        LIMIT $2`;
        const values = [id_user, page_size];
        const {
            rows
        } = await pool.query(text, values);

        res.json(rows);

    } catch (error) {
        next({
            error
        });
    }
}

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {
    getSubcategories,
    getSubcategoryOptions,
    getLastSubcategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory
}