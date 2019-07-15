'use strict'

// Load modules
const pool = require('../database');

// + Si necesito las últimas 5 del profe debo enviar page_size=5 y solo el user_id
// Get Categories
const getLastCategories = async (req, res, next) => {
    try {
    
        const id_user = req.query.id_user; // Obligatorio
        const id_subject = req.query.id_subject || null;
        const page_size = req.query.page_size || 20;
        

        // Obtiene las clases
        const text = `
            SELECT s.id_subject, s.name AS subject, c.id_category, c.name, c.created_at, c.updated_at 
            FROM categories AS c 
            INNER JOIN subjects AS s 
            ON s.id_subject = c.id_subject 
            WHERE c.id_user = $1 
            AND ($2::int IS NULL OR c.id_subject = $2)
            AND (c.name != DEFAULT) 
            ORDER BY c.updated_at DESC 
            LIMIT $3 
            OFFSET $4`;
        const values = [id_user, id_subject, page_size, from];
        const { rows } = await pool.query(text, values);

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
        next({ error });
    }
}
