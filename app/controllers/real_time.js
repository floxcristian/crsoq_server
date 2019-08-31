'use strict'

// POST:
// { id_class }
const startedQuestionInClass = async (req, res, next) => {

    try {
        const { id_class } = req.body;

        // Obtiene el 'id_course' a partir del 'id_class'
        const text = `
            SELECT m.id_course 
            FROM modules AS m 
            INNER JOIN classes AS c 
            ON m.id_module = c.id_module
            WHERE c.id_class = $1`;
        const values = [id_class];
        const id_course = (await pool.query(text, values)).rows[0].id_course;

        // Obtiene la pregunta iniciada (si es que hay)
        const text2 = `
            SELECT cq.id_question, cq.status, q.description, q.difficulty 
            FROM class_question AS cq
            INNER JOIN questions AS q
            ON cq.id_question = q.id_question
            INNER JOIN classes AS c
            ON cq.id_class = c.id_class
            INNER JOIN modules AS m
            ON c.id_module = m.id_module
            WHERE m.id_course = $1
            AND (cq.status = 2 OR cq.status = 3)`;
        const values2 = [id_course];
        const question = (await pool.query(text2, values2)).rows[0];

        res.json(question);

    } catch (error) {
        next({
            error
        });
    }

}