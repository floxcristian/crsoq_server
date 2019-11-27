"use strict";

// Load modules
const pool = require("../database");

// Get
const courseStudentPoints = async (req, res, next) => {
  try {
    const { id_course } = req.params;
    console.log("KRIS id_course: ", id_course);
    // Puntos de Preguntas y de Actividades

    /*
    const text = `
      SELECT au.id_user, count(au.id_user)
      FROM modules AS m
      INNER JOIN classes AS c
      ON m.id_module = c.id_module
      INNER JOIN activities AS a
      ON c.id_class = a.id_class
      INNER JOIN activity_user AS au
      ON a.id_activity = au.id_activity
      WHERE m.id_course = $1
      AND a.status = 2
      AND au.status = 2
      GROUP BY au.id_user
       `
    const values = [id_course];
    const { rows } = await pool.query(text, values);
*/

    // Obtiene array de clases

    const text = `
    SELECT u.id_user, u.document, u.name, u.last_name, u.middle_name, t3.question_points, t3.activity_points
    FROM course_user AS cu
    INNER JOIN users AS u
    ON cu.id_user = u.id_user
    INNER JOIN (
      SELECT 
      CASE WHEN (t1.id_user > 0) THEN t1.id_user ELSE t2.id_user END AS id_user,
      CASE WHEN (t1.question_points > 0) THEN t1.question_points ELSE '0' END AS question_points,
      CASE WHEN (t2.activity_points > 0) THEN t2.activity_points ELSE '0' END AS activity_points
      FROM ( 
        SELECT uqc.id_user, count(uqc.id_user) AS question_points
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
        GROUP BY uqc.id_user
      ) AS t1
      FULL JOIN (
        SELECT au.id_user, count(au.id_user) AS activity_points
        FROM modules AS m
        INNER JOIN classes AS c
        ON m.id_module = c.id_module
        INNER JOIN activities AS a
        ON c.id_class = a.id_class
        INNER JOIN activity_user AS au
        ON a.id_activity = au.id_activity
        WHERE m.id_course = $1
        AND a.status = 2
        AND au.status = 2
        GROUP BY au.id_user
      ) AS t2
      ON t1.id_user = t2.id_user
    ) AS t3
    ON u.id_user = t3.id_user
    WHERE cu.id_course = $1
    AND u.active = TRUE`;
    const values = [id_course];
    const { rows } = await pool.query(text, values);

    rows.forEach(item => {

      let { question_points, activity_points, total } = item;

      question_points = parseInt(question_points);
      activity_points = parseInt(activity_points);
      total = question_points + activity_points;
    });
    /*
        const text = `
          SELECT 
          CASE WHEN (t1.id_user > 0) THEN t1.id_user ELSE t2.id_user END AS id_user,
          CASE WHEN (t1.question_points > 0) THEN t1.question_points ELSE '0' END AS question_points,
          CASE WHEN (t2.activity_points > 0) THEN t2.activity_points ELSE '0' END AS activity_points
          FROM ( 
            SELECT uqc.id_user, count(uqc.id_user) AS question_points
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
            GROUP BY uqc.id_user
          ) AS t1
          FULL JOIN (
            SELECT au.id_user, count(au.id_user) AS activity_points
            FROM modules AS m
            INNER JOIN classes AS c
            ON m.id_module = c.id_module
            
            INNER JOIN activities AS a
            ON c.id_class = a.id_class
            INNER JOIN activity_user AS au
            ON a.id_activity = au.id_activity
            WHERE m.id_course = $1
            AND a.status = 2
            AND au.status = 2
            GROUP BY au.id_user
          ) AS t2
          ON t1.id_user = t2.id_user
          INNER JOIN (
            SELECT u.id_user, u.name, u.last_name, u.middle_name
            FROM course_user AS cu
            INNER JOIN users AS u
            ON cu.id_user = u.id_user
            WHERE cu.id_course = $1
            AND u.active = TRUE
          ) AS t3
          ON `;
        const values = [id_course];
        const { rows } = await pool.query(text, values);*/
    console.log("statistics: ", rows);

    res.json(rows);
  } catch (error) {
    next({ error });
  }
};

module.exports = {
  courseStudentPoints
};