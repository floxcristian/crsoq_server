'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const pool = require('../database');

//FRAGMENTOS DE CONSULTA
const CATEGORIES = 'SELECT id_category, id_user, id_subject, name, created_at, updated_at, count(*) OVER() AS count FROM categories';
const CATEGORIES_OPTIONS = `SELECT id_category, name FROM categories`;
const PAGINATION = ' ORDER BY id_category LIMIT $1 OFFSET $2';

// ----------------------------------------
// Get Categories
// ----------------------------------------
/*async function getCategories(req, res, next) {

    try {
        // Body Params
        const subject = req.params.subject;
        const teacher_options = req.params.teacher_options;
        const search = req.query.search;
        const from = Number(req.query.from);
        const limit = Number(req.query.limit);
        const last_by_techer = req.query.last_by_teacher;
        // Params
        const id_user = req.query.id_user;
        const id_subject = req.query.id_subject;


       
        //OBTIENE LAS CATEGORIAS DE UN PROFESOR, PARA UNA ASIGNATURA ESPECÍFICA
        if (id_user && id_subject) {
            const text = `SELECT id_category, name FROM categories WHERE id_user = $1 AND id_subject = $2;`;
            const values = [id_user, id_subject];
    
            const { rows } = await pool.query(text, values);
            return res.send(rows)
        }


        let values, query;

        if (last_by_techer) {
            const query = `SELECT s.name AS subject, c.id_category, c.name, c.created_at, c.updated_at FROM categories AS c INNER JOIN subjects AS s ON s.id_subject = c.id_subject WHERE id_user = $1 ORDER BY c.updated_at DESC LIMIT 5`;
            const values = [last_by_techer];
            const { rows } = await pool.query(query, values);
            return res.send(rows)
        }


        //
        if (teacher_options) {
            const query = `${CATEGORIES_OPTIONS} WHERE id_user = $1 ORDER BY name`;
            const values = [teacher_options]
            const { rows } = await pool.query(query, values);
            return res.send(rows[0])
        }
        else if ((from != undefined) && limit) {
            query = CATEGORIES;
            values = [limit, from];

            if (subject || search) query += ` WHERE `;
            if (subject) {
                query += `id_subject = $${values.length + 1}`;
                values.push(`${subject}`);
            }
            if (search) {
                query += `name = $${values.length + 1}`;
                values.push(`${search}`);
            }
            query += `${PAGINATION}`;

        }
        else {
            query = `${CATEGORIES_OPTIONS} ORDER BY name`;
        }


        const { rows } = await pool.query(query, values);


        const total = rows.length != 0 ? rows[0].count : 0;

        // Envía respuesta al client
        res.json({
            total,
            results: rows
        })
    } catch (error) {
        next({ error });
    }
}
*/

// Si necesito las últimas 5 del profe debo enviar page_size=5 y solo el user_id
// ----------------------------------------
// Get Categories
// ----------------------------------------
async function getCategories(req, res, next) {
    try {
        // Query Params
        const id_user = req.query.id_user; // Obligatorio
        const id_subject = req.query.id_subject || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        // Obtiene las clases
        const text = `SELECT s.id_subject, s.name AS subject, c.id_category, c.name, c.created_at, c.updated_at 
        FROM categories AS c 
        INNER JOIN subjects AS s 
        ON s.id_subject = c.id_subject 
        WHERE c.id_user = $1 
        AND ($2::int IS NULL OR c.id_subject = $2) 
        ORDER BY c.updated_at DESC 
        LIMIT $3 
        OFFSET $4`;
        const values = [id_user, id_subject, page_size, from];
        const {
            rows
        } = await pool.query(text, values);

        // Obtiene la cantidad total de clases (de acuerdo a los parámetros de filtro)
        const text2 = `
        SELECT count(*) 
        FROM categories 
        WHERE id_user = $1
        AND ($2::int IS NULL OR id_subject = $2)`;
        const values2 = [id_user, id_subject];
        const total_items = (await pool.query(text2, values2)).rows[0].count;

        // Envía la respuesta al cliente
        res.json({
            info: {
                total_pages: Math.ceil(total_items / page_size),
                page: page,
                page_size: page_size,
                total_items: parseInt(total_items),
            },
            items: rows
        });
    } catch (error) {
        next({
            error
        });
    }
}


// ----------------------------------------
// Get Categories as Select Options
// ----------------------------------------
async function getCategoryOptions(req, res, next) {
    try {
        // Query Params
        const id_user = req.query.id_user; // Obligatorio por ahora    
        const id_subject = req.query.id_subject; // Obligatorio por ahora  

        // Obtiene las categorías
        const text = 'SELECT id_category, name FROM categories WHERE id_user = $1 AND id_subject = $2 ORDER BY name';
        const values = [id_user, id_subject];
        const {
            rows
        } = await pool.query(text, values);

        // Envía la respuesta al cliente
        res.json(rows);
    } catch (error) {
        next({
            error
        });
    }
}


// ----------------------------------------
// Create Category
// ----------------------------------------
async function createCategory(req, res, next) {

    try {
        const {
            id_user,
            id_subject,
            name
        } = req.body;

        if (id_user && id_subject && name) {

            const text = 'INSERT INTO categories(id_user, id_subject, name) VALUES($1, $2, $3)';
            const values = [id_user, id_subject, name]
            const {
                rows
            } = await pool.query(text, values);

            // Envía la respuesta al cliente
            res.status(201).send(rows[0])
        } else {
            res.status(400).json({
                message: 'send all necessary fields'
            })
        }
    } catch (error) {
        next({
            error
        });
    }
}

// ----------------------------------------
// Update Category
// ----------------------------------------
async function updateCategory(req, res, next) {
    try {
        const id_category = req.params.categoryId;
        const {
            id_subject,
            name
        } = req.body;

        // Comprobar si existe el registro antes??

        const text2 = 'UPDATE categories SET id_subject = $1, name = $2, updated_at = NOW() WHERE id_category = $3';
        const values2 = [id_subject, name, id_category];
        const res2 = (await pool.query(text2, values2)).rows[0];

        res.json(res2)

    } catch (error) {
        next({
            error
        });
    }
}


// ----------------------------------------
// Delete Category
// ----------------------------------------
async function deleteCategory(req, res, next) {
    try {
        const id_category = req.params.categoryId;
        const text = 'DELETE FROM categories WHERE id_category = $1';
        const values = [id_category];
        await pool.query(text, values);

        // Envía la respuesta al cliente
        res.sendStatus(204);
    } catch (error) {
        next({
            error
        });
    }
}

async function getLastCategories(req, res, next) {
    try {
        const id_user = req.query.id_user; 
        const page_size = req.query.page_size || null;

        const text = `SELECT s.id_subject, s.name AS subject, c.id_category, c.name, c.created_at, c.updated_at 
        FROM categories AS c 
        INNER JOIN subjects AS s 
        ON s.id_subject = c.id_subject 
        WHERE c.id_user = $1 
        AND c.name != 'DEFAULT'
        ORDER BY c.updated_at DESC 
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
    getCategories,
    getCategoryOptions,
    getLastCategories,
    createCategory,
    updateCategory,
    deleteCategory
}