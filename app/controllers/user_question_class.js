'use strict'

// Load modules
const pool = require('../database');

// Obtiene la participación de una pregunta de clase
const getQuestionParticipation = async (req, res, next) => {
    try {
        const {
            id_class,
            id_question
        } = req.query;
        const text = `
            SELECT u.id_user, u.document, u.username, u.name, u.last_name, u.middle_name, uqc.status
            FROM user_question_class AS uqc
            INNER JOIN users AS u
            ON u.id_user = uqc.id_user
            WHERE u.active = true
            AND uqc.id_class = $1
            AND uqc.id_question = $2`;
        const values = [id_class, id_question];
        const { rows } = await pool.query(text, values);
        res.json(rows);
    } catch (error) {
        next({
            error
        });
    }
}

// Actualiza el estado de participación de múltiples estudiantes
const updateStudentsParticipation = async (req, res, next) => {
    try {
        let { id_question, id_class } = req.params;
        // Transforma parámetros a enteros
        [id_question, id_class] = [+id_question, +id_class];

        const { update_status_requests } = req.body;
        update_status_requests.map(item => {
            item.id_question = id_question,
            item.id_class = id_class
        });
        
        const text = `
            UPDATE user_question_class AS uqc 
            SET status = s.status 
            FROM (
                SELECT (a->>'id_class')::int AS id_class, (a->>'id_question')::int AS id_question ,(a->>'id_user')::int AS id_user, (a->>'status')::int AS status
                FROM (
                    SELECT jsonb_array_elements(a) AS a
                    FROM (values (($1)::jsonb)) s(a)
                ) AS s 
            ) AS s
            WHERE uqc.id_class = s.id_class
            AND uqc.id_question = s.id_question
            AND uqc.id_user = s.id_user`;
        const values = [JSON.stringify(update_status_requests)];
        await pool.query(text, values);

        res.send();
    }
    catch (error) {
        next({ error });
    }
}
/* 
Actualiza el estado de un estudiante
    const text = `
        INSERT INTO user_question_class(id_user, id_class, id_question, status) 
        VALUES($1, $2, $3, 3) 
        ON CONFLICT ON CONSTRAINT pk_user_question_class DO UPDATE SET status = 3, update_date = DEFAULT`;
    const values = [id_user, id_class, id_question];
    await pool.query(text, values);
*/

module.exports = {
    getQuestionParticipation,
    updateStudentsParticipation
}