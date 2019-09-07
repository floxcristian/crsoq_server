'use strict'

// Load modules
const pool = require('../database');

// Obtiene los últimos cursos actualizados
const getLatestUpdatedCourses = async (req, res, next) => {
    try {
        const { id_user } = req.query;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;


        /*const query = `
            SELECT s.id_subject, s.name AS subject, c.id_course, c.name, c.course_goal, ca.year, ca.semester, c.created_at, c.updated_at
            FROM courses AS c 
            INNER JOIN subjects AS s 
            ON s.id_subject = c.id_subject 
            INNER JOIN calendars as ca 
            ON ca.id_calendar = c.id_calendar 
            WHERE c.id_user = $1
            AND c.active = TRUE
            ORDER BY c.updated_at DESC 
            LIMIT $2 
            OFFSET $3`;
        const values = [id_user, page_size, from];
        const {
            rows
        } = await pool.query(query, values);
*/
        //> Obtener la cantidad de preguntas realizadas en el curso
        //const id_courses = rows.map(course => course.id_course);
        //console.log("id_courses: ", id_courses);
        //> SELECT con múltiples valores
        // https://stackoverflow.com/questions/10720420/node-postgres-how-to-execute-where-col-in-dynamic-value-list-query
        //> cantidad de preguntas hechas por cada curso
        //> ultima actualización en question_class
        const query = `
            SELECT s.name AS subject, c.id_course, ca.year, ca.semester, c.name, c.course_goal, MAX(cq.updated_at) AS last_updated_question, count(*) AS total_asked_questions
            FROM courses AS c
            INNER JOIN subjects AS s 
            ON s.id_subject = c.id_subject
            INNER JOIN calendars AS ca
            ON c.id_calendar = ca.id_calendar
            INNER JOIN modules AS m
            ON c.id_course = m.id_course
            INNER JOIN classes AS cl
            ON m.id_module = cl.id_module
            INNER JOIN class_question AS cq
            ON cl.id_class = cq.id_class
            WHERE c.id_user = $1
            AND c.active = TRUE
            AND cq.status= 5
            GROUP BY c.id_course, s.id_subject, ca.id_calendar 
            ORDER BY last_updated_question DESC
            LIMIT $2
            OFFSET $3`;

        //>
        /*const query2 = `
            SELECT m.id_course, count(*) AS asked_questions
            FROM modules AS m
            INNER JOIN classes AS c
            ON m.id_module = c.id_module
            INNER JOIN class_question AS cq
            ON c.id_class = cq.id_class
            WHERE m.id_course = ANY($1::int[])
            GROUP BY m.id_course`;
            //AND cq.status = 5
        //>*/
        const values = [id_user, page_size, from];
        const { rows } = (await pool.query(query, values));


        // Calcular porcentaje
        if (rows.length > 0) {
            rows.forEach(item => {
                item.total_asked_questions = parseInt(item.total_asked_questions);
                if (item.total_asked_questions > item.course_goal) item.percentage = 100
                else item.percentage = parseFloat(((item.total_asked_questions * 100) / item.course_goal).toFixed(2));
            });
        }
        console.log("asked_questions: ", rows);


        res.send({
            info: {
                //total_pages: Math.ceil(total_items / page_size),
                page: page,
                page_size: page_size,
                //total_items: parseInt(total_items),
            },
            items: rows
        });
    }
    catch (error) {
        next({ error });
    }
}

// Obtiene los cursos
const getCourses = async (req, res, next) => {

    try {
        const id_user = req.query.id_user || null;
        const id_subject = req.query.id_subject || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;
        const code = req.query.code || null;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

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
        res.send({
            info: {
                //total_pages: Math.ceil(total_items / page_size),
                page: page,
                page_size: page_size,
                //total_items: parseInt(total_items),
            },
            items: rows
        });
    } catch (error) {
        next({
            error
        });
    }
}

// Obtiene cursos a partir de su código
const getCoursesBy = async (req, res, next) => {
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

// Obtiene el detalle de un curso
const getCourseDetail = async (req, res, next) => {
    try {

        const { id_course } = req.params;

        const text = `
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
        } = await pool.query(text, values);
        if (rows.length > 0) {
            return res.send(rows[0]);
        } else {
            return res.status(400).json({
                message: 'No se encontró el curso'
            });
        }

    } catch (error) {
        next({
            error
        });
    }
}

// Crea un curso
const createCourse = async (req, res, next) => {

    try {
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
            //> Para que es with??
            const text = `
                WITH user_subject AS (
                    INSERT INTO user_subject(id_user,id_subject) VALUES($1,$2) ON CONFLICT ON CONSTRAINT pk_user_subject DO NOTHING
                ) 
                INSERT INTO courses(id_calendar, id_user, id_subject, name, course_goal, student_goal, code) 
                VALUES($3, $4, $5, $6, $7, $8, LEFT(uuid_generate_v4()::text, 8))`
            const values = [id_user, id_subject, id_calendar, id_user, id_subject, name, course_goal, student_goal]
            await pool.query(text, values);
            res.json({
                message: 'successfully created calendar'
            });
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

// Actualiza un curso
const updateCourse = async (req, res, next) => {
    try {
        const { id_course } = req.params;
        const {
            id_calendar,
            id_subject,
            name,
            course_goal,
            student_goal,
            active
        } = req.body;

        let text = `
            UPDATE courses 
            SET id_calendar = $1, id_subject = $2, name = $3, course_goal = $4, student_goal = $5, active = $6 
            WHERE id_course = $7 
            RETURNING id_course, id_calendar, id_user, id_subject, name, course_goal, student_goal, created_at, updated_at, code, active`;
        let values = [id_calendar, id_subject, name, course_goal, student_goal, active, id_course];
        const {
            rows
        } = await pool.query(text, values);
        //EL PROBLEMA ES QUE NECESITO DEVOLVER UNA RESPUESTA CON JOIN DE TABLAS (courses, calendars, subjects)
        res.json(rows);

    } catch (error) {
        next({
            error
        });
    }
}

// Elimina un curso
const deleteCourse = async (req, res, next) => {
    try {
        const { id_course } = req.params;
        const text = `
            DELETE FROM courses 
            WHERE id_course = $1`;
        const values = [id_course];
        await pool.query(text, values);
        res.sendStatus(204);
    } catch (error) {
        next({
            error
        });
    }
}

module.exports = {
    getCourses,
    getCoursesBy,
    getCourseDetail,
    getCourseOptions,
    getLatestUpdatedCourses,
    createCourse,
    updateCourse,
    deleteCourse
}