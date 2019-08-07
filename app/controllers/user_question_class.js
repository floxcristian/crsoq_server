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
            SELECT u.document, u.username, u.name, u.last_name, u.middle_name, uqc.status
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

/* 
Actualiza el estado del estudiante
        const text = `
            INSERT INTO user_question_class(id_user, id_class, id_question, status) 
            VALUES($1, $2, $3, 3) 
            ON CONFLICT ON CONSTRAINT pk_user_question_class DO UPDATE SET status = 3, update_date = DEFAULT`;
        const values = [id_user, id_class, id_question];
        await pool.query(text, values);
*/

module.exports = {
    getQuestionParticipation
}