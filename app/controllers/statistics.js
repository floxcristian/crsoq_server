'use strict'

// Load modules
const pool = require('../database');

// Get 
const courseStudentPoints = async (req, res, next) => {

    try {
        const { id_course } = req.params;
        console.log("KRIS id_course: ", id_course);
        /*
        const text = `
            SELECT uqc.id_user
            FROM modules AS m
            INNER JOIN classes AS c
            ON m.id_module = c.id_module
            INNER JOIN class_question AS cq
            ON c.id_class = cq.id_class
            INNER JOIN user_question_class AS uqc
            ON (cq.id_class = uqc.id_class AND cq.id_question = uqc.id_question)
            WHERE m.id_course = $1
            AND cq.status = 5`;
        const values = [id_course];
        await pool.query(text, values);

        */
    } catch (error) {
        next({ error });
    }
}

module.exports = {
    courseStudentPoints
}