'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const pool = require('../database');

async function getCourses(req, res, next) {

    try {
        // Query Params
        const id_user = req.query.id_user || null;
        const id_subject = req.query.id_subject || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;
        const code = req.query.code || null;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        console.log(`id_user: ${id_user}, id_subject: ${id_subject}`);
        const query = `
            SELECT s.id_subject, s.name AS subject, c.id_course, c.name, c.code, c.course_goal, c.student_goal, c.active, ca.id_calendar, ca.year, ca.semester, c.created_at, c.updated_at 
            FROM courses AS c 
            INNER JOIN subjects AS s 
            ON s.id_subject = c.id_subject 
            INNER JOIN calendars as ca 
            ON ca.id_calendar = c.id_calendar 
            WHERE ($1::int IS NULL OR c.id_user = $1)
            AND ($2::varchar IS NULL OR c.code = $2)
            AND ($3::int IS NULL OR c.id_subject = $3)
            ORDER BY c.updated_at DESC 
            LIMIT $4 
            OFFSET $5`;
        const values = [id_user, code, id_subject, page_size, from];
        const {
            rows
        } = await pool.query(query, values);
        return res.send({
            info: {
                //total_pages: Math.ceil(total_items / page_size),
                page: page,
                page_size: page_size,
                //total_items: parseInt(total_items),
            },
            items: rows
        })

    } catch (error) {
        next({
            error
        });
    }
}

// Obtiene los cursos a partir de su código.
async function getCoursesBy(req, res, next) {
    try {
        const code = req.query.code || null;
        const id_user = req.query.id_user || null;

        const query = `
        SELECT s.id_subject, s.name AS subject, c.id_course, c.name, c.code, c.course_goal, c.student_goal, ca.year, ca.semester, c.created_at, c.updated_at, 
        CASE WHEN EXISTS (
            SELECT cu.id_user 
            FROM course_user AS cu 
            WHERE cu.id_course = c.id_course 
            AND cu.id_user = $1) 
            THEN TRUE 
            ELSE FALSE END AS enrolled 
        FROM courses AS c 
        INNER JOIN subjects AS s 
        ON s.id_subject = c.id_subject 
        INNER JOIN calendars as ca 
        ON ca.id_calendar = c.id_calendar 
        WHERE ($2::varchar IS NULL OR code = $2)`;
        const values = [id_user, code];
        const {
            rows
        } = await pool.query(query, values);

        res.send(rows);
    } catch (error) {
        next({
            error
        });
    }
}

async function getCourseOptions(req, res, next) {
    try {

    } catch (error) {

    }
}

async function getCourseDetail(req, res, next) {
    try {
        // Query Params
        const id_course = req.params.courseId;

        const query = `
        SELECT s.id_subject, s.name AS subject, c.id_course, c.active, c.name, c.code, c.course_goal, c.student_goal, ca.id_calendar, ca.year, ca.semester, c.created_at, c.updated_at 
        FROM courses AS c 
        INNER JOIN subjects AS s 
        ON s.id_subject = c.id_subject 
        INNER JOIN calendars AS ca 
        ON ca.id_calendar = c.id_calendar 
        WHERE id_course = $1;`;
        const values = [id_course];
        const {
            rows
        } = await pool.query(query, values);
        if (rows.length > 0) {
            return res.send(rows[0])
        } else {
            return res.status(400).json({
                message: 'No se encontró el curso'
            })
        }

    } catch (error) {
        next({
            error
        });
    }
}



async function createCourse(req, res, next) {

    try {
        // Body Params 
        const {
            id_calendar,
            id_user,
            id_subject,
            name,
            course_goal,
            student_goal
        } = req.body;

        if (id_calendar && id_user && id_subject && name && course_goal && student_goal) {

            // Inserta un workspace (si ya existe no hace nada)
            const text = `WITH user_subject AS (
                INSERT INTO user_subject(id_user,id_subject) VALUES($1,$2) ON CONFLICT ON CONSTRAINT pk_user_subject DO NOTHING
                ) 
                INSERT INTO courses(id_calendar, id_user, id_subject, name, course_goal, student_goal, code) 
                VALUES($3, $4, $5, $6, $7, $8, LEFT(uuid_generate_v4()::text, 8))`
            const values = [id_user, id_subject, id_calendar, id_user, id_subject, name, course_goal, student_goal]
            const {
                rows
            } = await pool.query(text, values);
            res.json({
                message: 'successfully created calendar'
            })
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


async function updateCourse(req, res, next) {
    try {
        const id_course = req.params.courseId;
        const {
            id_calendar,
            id_subject,
            name,
            course_goal,
            student_goal,
            active
        } = req.body;

        let text = 'UPDATE courses SET id_calendar = $1, id_subject = $2, name = $3, course_goal = $4, student_goal = $5, active = $6 WHERE id_course = $7 RETURNING id_course, id_calendar, id_user, id_subject, name, course_goal, student_goal, created_at, updated_at, code, active';
        let values = [id_calendar, id_subject, name, course_goal, student_goal, active, id_course];
        const {
            rows
        } = await pool.query(text, values);
        //EL PROBLEMA ES QUE NECESITO DEVOLVER UNA RESPUESTA CON JOIN DE TABLAS (courses, calendars, subjects)
        res.json(rows)

    } catch (error) {
        next({
            error
        });
    }
}

async function deleteCourse(req, res, next) {
    try {
        const id_course = req.params.courseId;
        const {
            rows
        } = await pool.query('DELETE FROM courses WHERE id_course = $1', [id_course]);
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
    getCourses,
    getCoursesBy,
    getCourseDetail,
    getCourseOptions,
    createCourse,
    updateCourse,
    deleteCourse
}