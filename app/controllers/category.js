'use strict'

// Load modules
const pool = require('../database');


// Si necesito las últimas 5 del profe debo enviar page_size=5 y solo el user_id
// Obtiene las categorías
const getCategories = async (req, res, next) => {
    
    try {
       
        const { id_user } = req.query;
        const id_subject = req.query.id_subject || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        // Obtiene las clases
        const text = `
            SELECT s.id_subject, s.name AS subject, c.id_category, c.name, c.created_at, c.updated_at 
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
        const { count } = (await pool.query(text2, values2)).rows[0];

        res.json({
            info: {
                total_pages: Math.ceil(count / page_size),
                page: page,
                page_size: page_size,
                total_items: parseInt(count),
            },
            items: rows
        });
    } catch (error) {
        next({
            error
        });
    }
}

// Get categories as select options
const getCategoryOptions = async (req, res, next) => {
    try { 
        const { id_user, id_subject } = req.query; 
        const text = `
            SELECT id_category, name 
            FROM categories 
            WHERE id_user = $1 
            AND id_subject = $2 
            ORDER BY name`;
        const values = [id_user, id_subject];
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


// Crea una categoría
const createCategory = async (req, res, next) => {
    try {
        const {
            id_user,
            id_subject,
            name
        } = req.body;

        if (id_user && id_subject && name) {

            const text = `
                INSERT INTO categories(id_user, id_subject, name) 
                VALUES($1, $2, $3)`;
            const values = [id_user, id_subject, name]
            const {
                rows
            } = await pool.query(text, values);

            res.status(201).send(rows[0]);
        } else {
            res.status(400).json({
                message: 'send all necessary fields'
            });
        }
    } catch (error) {
        next({
            error
        });
    }
}

// Actualiza una categoría
const updateCategory = async (req, res, next) => {
    
    try {
        const { id_category } = req.params;
        const {
            id_subject,
            name
        } = req.body;

        // Comprobar si existe el registro antes??

        const text = `
            UPDATE categories 
            SET id_subject = $1, name = $2, updated_at = NOW() 
            WHERE id_category = $3`;
        const values = [id_subject, name, id_category];
        const { rows } = await pool.query(text, values);

        res.json(rows[0]);

    } catch (error) {
        next({
            error
        });
    }
}


// Elimina una categoría
const deleteCategory = async (req, res, next) => {
    try {
        const { id_category } = req.params;
        const text = `
            DELETE FROM categories 
            WHERE id_category = $1`;
        const values = [id_category];
        await pool.query(text, values);
        res.sendStatus(204);
    } catch (error) {
        next({
            error
        });
    }
}

const getLastCategories = async (req, res, next) => {
    try {
        const { id_user } = req.query; 
        const page_size = req.query.page_size || null;

        const text = `
        SELECT s.id_subject, s.name AS subject, c.id_category, c.name, c.created_at, c.updated_at 
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

module.exports = {
    getCategories,
    getCategoryOptions,
    getLastCategories,
    createCategory,
    updateCategory,
    deleteCategory
}