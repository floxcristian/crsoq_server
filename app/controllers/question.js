'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const pool = require('../database');
const _f_exts = require('../config/file_exts');
const _file = require('../services/file');

// ----------------------------------------
// Init Upload Service
// ----------------------------------------
const upload = _file.uploadFile('images/questions', _f_exts.IMAGE_EXTS, 5, 'image');

// ----------------------------------------
// Get Questions
// ----------------------------------------
async function getQuestions(req, res, next) {

    try {

        // Query Params
        //const search = req.query.search;

        const id_user = req.query.id_user; // Obligatorio por el momento
        const id_subject = req.query.id_subject || null;
        const id_category = req.query.id_category || null;
        const id_subcategory = req.query.id_subcategory || null;
        const difficulty = req.query.difficulty || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        console.log(`id_user: ${id_user}, id_subject: ${id_subject}, id_category: ${id_category}, id_subcategory: ${id_subcategory}, difficulty: ${difficulty}, page_size: ${page_size}, page: ${page}`);

        // Obtiene las preguntas por id de usuario (profesor) y id de asignatura 
        const text = `
            SELECT su.id_subject, su.name AS subject, c.id_category, c.name AS category, s.id_subcategory, s.name AS subcategory, q.id_question, q.description, q.difficulty, q.shared, q.image, q.created_at, q.updated_at 
            FROM questions AS q 
            INNER JOIN subcategories AS s 
            ON q.id_subcategory = s.id_subcategory 
            INNER JOIN categories AS c 
            ON s.id_category = c.id_category 
            INNER JOIN subjects AS su 
            ON c.id_subject = su.id_subject 
            WHERE id_user = $1 
            AND ($2::int IS NULL OR su.id_subject = $2)
            AND ($3::int IS NULL OR c.id_category = $3)
            AND ($4::int IS NULL OR s.id_subcategory = $4)
            AND ($5::int IS NULL OR q.difficulty = $5)
            ORDER BY q.updated_at DESC
            LIMIT $6 
            OFFSET $7
            `;
        const values = [id_user, id_subject, id_category, id_subcategory, difficulty, page_size, from];
        const {
            rows
        } = await pool.query(text, values);

        // Obtiene la cantidad total de preguntas (de acuerdo a los parámetros de filtro)
        const text2 = `
        SELECT count(*)
        FROM questions
        WHERE ($1::int IS NULL OR difficulty = $1)
        AND (
            ($2::int IS NOT NULL AND id_subcategory = $2) 
            OR ($2 IS NULL AND id_subcategory IN (
                SELECT id_subcategory
                FROM subcategories
                WHERE ($3::int IS NOT NULL AND id_category = $3)
                OR ($3 IS NULL AND id_category IN (
                    SELECT id_category
                    FROM categories 
                    WHERE id_user = $4
                    AND ($5::int IS NULL OR id_subject = $5)
                    )
            )))
        )`;
        const values2 = [difficulty, id_subcategory, id_category, id_user, id_subject];
        const total_items = (await pool.query(text2, values2)).rows[0].count;

        // Envía la respuesta al cliente
        return res.send({
            info: {
                total_pages: Math.ceil(total_items / page_size),
                page: page,
                page_size: page_size,
                total_items: parseInt(total_items),
            },
            items: rows
        })

    } catch (error) {
        next({
            error
        });
    }
}


/*
async function getQuestionOptions(req, res, next) {
    try {
        const id_category = req.query.id_category; // Obligatorio por ahora 

        // Obtiene las preguntas
        const text = 'SELECT id_subcategory, name FROM subcategories WHERE WHERE id_category = $1 ORDER BY name';
        const values = [id_category];
        const { rows } = await pool.query(text, values);

        // Envía la Respuesta
        res.json(rows);
    } catch {
        next({ error });
    }

}
*/

// ----------------------------------------
// Create Question
// ----------------------------------------
async function createQuestion(req, res, next) {

    upload(req, res, async (error) => {

        if (error) return res.sendStatus(500);
        const file_path = req.file !== undefined ? req.file.path : undefined;

        try {
            // Body Params
            const {
                id_subcategory,
                description,
                difficulty
            } = req.body;

            const text = 'INSERT INTO questions(id_subcategory, description, difficulty, image) VALUES($1, $2, $3, $4) RETURNING *';
            const values = [id_subcategory, description, difficulty, file_path];
            const {
                rows
            } = await pool.query(text, values);

            // Envía la respuesta al cliente
            res.status(201).send(rows[0]);
        } catch (error) {
            if (file_path) _file.deleteFile(file_path);
            next({
                error
            });
        }
    });

}

// ----------------------------------------
// Update Question
// ----------------------------------------
async function updateQuestion(req, res, next) {

    upload(req, res, async (error) => {

        if (error) return res.sendStatus(500);
        const file_path = req.file !== undefined ? req.file.path : undefined;

        try {
            // Body Params
            const {
                id_subcategory,
                description,
                difficulty,
                image,
                shared
            } = req.body;
            // Params
            const id_question = req.params.questionId;

            // Consulta para asegurarme de que existe la pregunta y para obtener la ruta de la imagen actual
            const text1 = 'SELECT id_question, image FROM questions WHERE id_question = $1';
            const values1 = [id_question];
            const res1 = (await pool.query(text1, values1)).rows;

            // Si la pregunta no existe
            if (res1.length == 0) {
                // Elimino la imagen recien cargada al servidor
                if (file_path) _file.deleteFile(file_path);
                // Envío la respuesta al cliente
                return res.status(400).json({
                    message: `questions ${id_question} does not exists`
                });
            }

            // Si tengo una nueva imagen (o recibo image:null), elimino la imagen que la pregunta tenía anteriormente
            if (file_path || !image) _file.deleteFile(res1[0].image);

            // Consulta para actualizar los datos de la pregunta
            const text2 = 'UPDATE questions SET id_subcategory = $1, description = $2, difficulty = $3, image = $4, shared = $5, updated_at = NOW() WHERE id_question = $6 RETURNING *';
            const values2 = [id_subcategory, description, difficulty, file_path ? file_path : image, shared, id_question];
            const res2 = await (pool.query(text2, values2)).rows;

            // Envío la respuesta al cliente
            res.json(res2)

        } catch (error) {
            // Si ocurrio algun error elimino la imagen recien cargada al servidor
            if (file_path) _file.deleteFile(file_path);
            next({
                error
            });
        }
    });
}

// ----------------------------------------
// Delete Question
// ----------------------------------------
async function deleteQuestion(req, res, next) {
    try {
        const id_question = req.params.questionId;

        const text = 'DELETE FROM questions WHERE id_question = $1';
        const values = [id_question]
        await pool.query(text, values);

        res.sendStatus(204);

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
    getQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion
}