"use strict";

// Load modules
const pool = require("../database");

// Get
const courseStudentPoints = async (req, res, next) => {
  try {
    const { id_course } = req.params;
    console.log("KRIS id_course: ", id_course);
    // Puntos de Preguntas y de Actividades

    const text = `
            SELECT uqc.id_user, count(*) AS question_points
            FROM modules AS m
            INNER JOIN classes AS c
            ON m.id_module = c.id_module
            INNER JOIN activities AS a
            ON c.id_class = a.id_class
            INNER JOIN activity_user AS au
            ON a.id_activity = au.id_activity
            INNER JOIN class_question AS cq
            ON c.id_class = cq.id_class
            INNER JOIN user_question_class AS uqc
            ON (cq.id_class = uqc.id_class AND cq.id_question = uqc.id_question)
            WHERE m.id_course = $1
            AND cq.status = 5
            AND uqc.status = 5
            GROUP BY uqc.id_user`;
    const values = [id_course];
    const { rows } = await pool.query(text, values);


    console.log("statistics: ", rows);
    // Obtiene array de clases
    const text1 = `
      SELECT 
      FROM (
        SELECT id_class
        FROM modules AS m
        INNER JOIN classes AS c
        ON m.id_module = c.id_module
        INNER JOIN class_question AS cq
        ON c.id_class = cq.id_class
        INNER JOIN user_question_class AS uqc
        ON (cq.id_class = uqc.id_class AND cq.id_question = uqc.id_question)
        WHERE m.id_course = $1
        AND cq.status = 5
        AND uqc.status = 5
        GROUP BY uqc.i_user
      ) AS t1
      `;
    const values1 = [id_course];



    res.json('hi');
  } catch (error) {
    next({ error });
  }
};

module.exports = {
  courseStudentPoints
};
