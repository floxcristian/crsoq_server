'use strict'

// Load modules
const colors = require('colors');
const pool = require('../database');
const _file = require('../services/file');
var socket = require('../../index');

// ----------------------------------------
// Obtiene las preguntas que ya han sido agregadas a la clase.
// + Enviar atributo winners: true/false
// ----------------------------------------
async function getLessonQuestions(req, res, next) {

    try {
        // Query Params
        const id_lesson = req.query.id_lesson;
        const id_category = req.query.id_category || null;
        const id_subcategory = req.query.id_subcategory || null;
        const difficulty = req.query.difficulty || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        console.log(`id_lesson: ${id_lesson}, id_category: ${id_category}, id_subcategory: ${id_subcategory}, difficulty: ${difficulty}, page_size: ${page_size}, page: ${page}`);

        /*
         CASE WHEN EXISTS (
            SELECT id_user 
            FROM activity_user AS au 
            WHERE id_activity = a.id_activity 
            AND status = 2
        ) THEN TRUE ELSE FALSE END AS winners

        */

        // Obtiene las preguntas por id de usuario (profesor) y id de asignatura 
        const text = `
            SELECT c.id_category, c.name AS category, s.id_subcategory, s.name AS subcategory, q.id_question, q.description, q.difficulty, q.shared, q.image, cq.status, cq.added_at, cq.updated_at,
            CASE WHEN EXISTS (
                SELECT id_user
                FROM user_question_class
                WHERE id_question = q.id_question
                AND id_class = cq.id_class
                AND status = 4
            ) THEN TRUE ELSE FALSE END AS winners
            FROM questions AS q
            INNER JOIN class_question AS cq
            ON q.id_question = cq.id_question
            INNER JOIN subcategories AS s 
            ON q.id_subcategory = s.id_subcategory 
            INNER JOIN categories AS c 
            ON s.id_category = c.id_category
            WHERE cq.id_class = $1
            AND ($2::int IS NULL OR c.id_category = $2)
            AND ($3::int IS NULL OR s.id_subcategory = $3)
            AND ($4::int IS NULL OR q.difficulty = $4)
            ORDER BY q.updated_at DESC
            LIMIT $5 
            OFFSET $6`;
        const values = [id_lesson, id_category, id_subcategory, difficulty, page_size, from];
        const {
            rows
        } = await pool.query(text, values);

        // Obtiene la cantidad total de preguntas (de acuerdo a los parámetros de filtro)
        const text2 = `
            SELECT count(*)
            FROM questions AS q
            INNER JOIN class_question AS cq
            ON q.id_question = cq.id_question
            INNER JOIN subcategories AS s 
            ON q.id_subcategory = s.id_subcategory 
            INNER JOIN categories AS c 
            ON s.id_category = c.id_category
            WHERE id_class = $1
            AND ($2::int IS NULL OR c.id_category = $2)
            AND ($3::int IS NULL OR s.id_subcategory = $3)
            AND ($4::int IS NULL OR q.difficulty = $4)`;
        const values2 = [id_lesson, id_category, id_subcategory, difficulty];
        const total_items = (await pool.query(text2, values2)).rows[0].count;

        res.send({
            info: {
                total_pages: Math.ceil(total_items / page_size),
                page: page,
                page_size: page_size,
                total_items: parseInt(total_items),
            },
            items: rows
        });

    } catch (error) {
        next({
            error
        });
    }
}

// Obtiene las preguntas de la biblioteca de la asignatura e indica cuales han sido agregadas a la clase.
async function getAllQuestionsForLesson(req, res, next) {
    try {

        // Query Params
        const id_user = req.query.id_user;
        const id_subject = req.query.id_subject;
        const id_lesson = req.query.id_lesson;

        const id_category = req.query.id_category || null;
        const id_subcategory = req.query.id_subcategory || null;
        const difficulty = req.query.difficulty || null;

        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        console.log(`id_lesson: ${id_lesson}, id_category: ${id_category}, id_subcategory: ${id_subcategory}, difficulty: ${difficulty}, page_size: ${page_size}, page: ${page}`);

        // Obtiene las preguntas por id de usuario (profesor) y id de asignatura 
        // Me sirve { id_course}
        const text = `
            SELECT c.id_category, c.name AS category, s.id_subcategory, s.name AS subcategory, q.id_question, q.description, q.difficulty, q.shared, q.image, q.updated_at,
            CASE WHEN EXISTS (
                SELECT id_question 
                FROM class_question AS cq
                WHERE cq.id_question = q.id_question
                AND cq.id_class = $6
            ) THEN TRUE ELSE FALSE END AS added 
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
            LIMIT $7 
            OFFSET $8`;
        const values = [id_user, id_subject, id_category, id_subcategory, difficulty, id_lesson, page_size, from];
        const {
            rows
        } = await pool.query(text, values);

        // Obtiene la cantidad total de preguntas (de acuerdo a los parámetros de filtro)
        const text2 = `
            SELECT count(*)
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
            AND ($5::int IS NULL OR q.difficulty = $5)`;
        const values2 = [id_user, id_subject, id_category, id_subcategory, difficulty];
        const total_items = (await pool.query(text2, values2)).rows[0].count;

        res.send({
            info: {
                total_pages: Math.ceil(total_items / page_size),
                page: page,
                page_size: page_size,
                total_items: parseInt(total_items),
            },
            items: rows
        });

    } catch (error) {
        next({
            error
        });
    }
}

async function getQuestionByCourse(req, res, next) {
    try {


        const id_course = req.params.courseId;
        console.log("BY COURSE: ", id_course)
        const id_category = req.query.id_category || null;
        const id_subcategory = req.query.id_subcategory || null;
        const difficulty = req.query.difficulty || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        const text = `
            SELECT cl.id_class, cl.description AS class, c.id_category, c.name AS category, s.id_subcategory, s.name AS subcategory, q.id_question, q.description, q.difficulty, q.shared, q.image, cq.status, cq.added_at, cq.updated_at
            FROM questions AS q
            INNER JOIN class_question AS cq
            ON q.id_question = cq.id_question
            INNER JOIN classes AS cl
            ON cq.id_class = cl.id_class
            INNER JOIN modules AS m
            ON cl.id_module = m.id_module
            INNER JOIN subcategories AS s 
            ON q.id_subcategory = s.id_subcategory 
            INNER JOIN categories AS c 
            ON s.id_category = c.id_category
            WHERE m.id_course = $1
            AND ($2::int IS NULL OR c.id_category = $2)
            AND ($3::int IS NULL OR s.id_subcategory = $3)
            AND ($4::int IS NULL OR q.difficulty = $4)
            ORDER BY q.updated_at DESC
            LIMIT $5
            OFFSET $6`;
        const values = [id_course, id_category, id_subcategory, difficulty, page_size, from];
        const {
            rows
        } = await pool.query(text, values);

        const text2 = `
            SELECT count(*)
            FROM questions AS q
            INNER JOIN class_question AS cq
            ON q.id_question = cq.id_question
            INNER JOIN classes AS cl
            ON cq.id_class = cl.id_class
            INNER JOIN modules AS m
            ON cl.id_module = m.id_module
            INNER JOIN subcategories AS s 
            ON q.id_subcategory = s.id_subcategory 
            INNER JOIN categories AS c 
            ON s.id_category = c.id_category
            WHERE m.id_course = $1
            AND ($2::int IS NULL OR c.id_category = $2)
            AND ($3::int IS NULL OR s.id_subcategory = $3)
            AND ($4::int IS NULL OR q.difficulty = $4)`
        const values2 = [id_course, id_category, id_subcategory, difficulty];
        const total_items = (await pool.query(text2, values2)).rows[0].count;

        res.send({
            info: {
                total_pages: Math.ceil(total_items / page_size),
                page: page,
                page_size: page_size,
                total_items: parseInt(total_items),
            },
            items: rows
        });

    } catch (error) {
        next({
            error
        });
    }
}

// Crea o elimina múltiples preguntas en una clase
// + Asegurarse que una pregunta no este en otra clase?
async function updateLessonQuestions(req, res, next) {
    const client = await pool.pool.connect();

    try {
        // Body Params
        const {
            id_lesson,
            add_questions,
            delete_questions
        } = req.body;

        console.log("add_works: ", add_questions);
        console.log("delete_works: ", delete_questions);
        // Inicia la transacción
        client.query('BEGIN');

        // Array para ejecutar consultas en paralelo
        let promises = [];

        if (add_questions && add_questions.length > 0) {
            // Inserción del workspace
            const {
                text,
                values
            } = insertLessonQuestions(add_questions, id_lesson);
            // Agrega la query al array 'promises'
            promises.push(client.query(text, values));
        }

        if (delete_questions && delete_questions.length > 0) {
            const {
                text,
                values
            } = deleteLessonQuestions(delete_questions, id_lesson);
            promises.push(client.query(text, values));
        }

        const result_update = await Promise.all(promises);

        // Finaliza la transacción
        await client.query('COMMIT')

        res.json({})

    } catch (error) {
        await client.query('ROLLBACK');
        next({
            error
        });
    } finally {
        client.release();
    }
}


// Actualiza el estado de la pregunta de una clase
// + Estados: 1: no iniciada, 2: activa, 3: detenida, 4: finalizada
// * Estados de pregunta de clase: 1: no iniciada, 2: activa, 3: detenida, 4: estudiante respondiendo , 5: finalizada
const updateLessonQuestion = async (req, res, next) => {

    try {

        const {
            status
        } = req.body;
        const id_class = req.params.classId;
        const id_question = req.params.questionId;

        if (status == 1) { // Si se desea reiniciar una pregunta (volver al estado 'no iniciada')

            // Eliminar los registros de participación de la pregunta de clase
            const text = `
                DELETE FROM user_question_class
                WHERE id_question = $1
                AND id_class = $2`;
            const values = [id_question, id_class];
            await pool.query(text, values);

        } else if (status == 2) { // Si se desea iniciar una pregunta

            // Verificar que no halla otra pregunta iniciada o detenida en la clase
            const text = `
                SELECT CASE WHEN EXISTS (
                    SELECT status 
                    FROM class_question
                    WHERE id_class = $1
                    AND id_question != $2
                    AND (status = 2 OR status = 3)
                ) THEN TRUE ELSE FALSE END AS any_question_started`;
            const values = [id_class, id_question];
            const { any_question_started } = (await pool.query(text, values)).rows[0];

            if (any_question_started) return res.send(null); // Si ya hay una pregunta iniciada enviar null para que no se inicie la clase

        } else if (status == 4) { // Si se desea finalizar una pregunta

            // Vacíar el array de participantes 'student_participants_of_a_question[id_class]' de la pregunta en juego
            socket.setStudentParticipants({
                id_class: id_class,
                data: null
            });

            // Modificar el estado de los estudiantes en clase 'students_in_classrooms[id_class]' a 'en espera' (status 1) 
            // + Crear una función seteadora en socket?..
            let students_in_class = socket.getStudentsInClassroom(id_class);

            if (students_in_class && students_in_class.length > 0) {
                students_in_class.forEach(student => {
                    student.participation_status = 1;
                });
            }

            // Emite nuevo array de participantes a estudiantes
            // + Creo que no es necesario, lo puedo hacer desde el mismo cliente y dando un tiempo para que el
            //   estudiante alcance a ver quien gano.
            // let io = socket.getSocket();
            // io.in(id_class + 'play-question-section')
            //     .emit('studentHasEnteredToTheClassroom',
            //         socket.getStudentsInClassroom(id_class)
            //     );
        }

        // + Verificar que el estado de la pregunta cambia antes de actualizar?
        // Obtiene el estado de la pregunta
        const text = `
            SELECT status 
            FROM class_question 
            WHERE id_class = $1
            AND id_question = $2`;
        const values = [id_class, id_question];
        const original_status = (await pool.query(text, values)).rows[0];

        // Actualiza el estado de la pregunta de clase
        const text2 = `
            UPDATE class_question 
            SET status = $1 
            WHERE id_class = $2 
            AND id_question = $3 
            RETURNING *`;
        const values2 = [status, id_class, id_question];
        const {
            rows
        } = await pool.query(text2, values2);

        // Obtiene datos de la pregunta
        const text3 = `
            SELECT id_question, difficulty, description, image 
            FROM questions
            WHERE id_question = $1`;
        const values3 = [id_question];
        const question = (await pool.query(text3, values3)).rows[0];
        question.status = status; // Asigna el estado actual de la pregunta al objeto

        let io = socket.getSocket(); // Obtiene el socket
        // Emite la pregunta a los estudiantes que esten en la sección de juego de la clase
        io.in(id_class + 'play-question-section').emit('playingTheClassQuestion', {
            question
        });

        // Si se ha iniciado una pregunta y el estado actualizado es diferente al estado original 
        if (status == 2 && original_status != status) {
            // Crea un array de estudiantes en la clase...

            // Obtiene el 'id_course' y el 'subject' para emitir notificación
            const text = `
                SELECT m.id_course, s.name AS subject 
                FROM modules AS m
                INNER JOIN classes AS cl
                ON cl.id_module = m.id_module
                INNER JOIN courses AS c
                ON m.id_course = c.id_course
                INNER JOIN subjects AS s
                ON c.id_subject = s.id_subject
                WHERE cl.id_class = $1`;
            const values = [id_class];
            const {
                id_course,
                subject
            } = (await pool.query(text, values)).rows[0];

            // Emite notificación a estudiantes del curso indicando que se ha iniciado una pregunta
            io.in(id_course + 'students').emit('classQuestionStarted', {
                id_course,
                subject
            });

            console.log(`${colors.cyan.bold('[SOCKET]'.padStart(10))} emit(classQuestionStarted) to:`);
            io.in(id_course + 'students').clients((error, clients) => {
                if (error) throw error;
                console.table(clients);
            });

        }

        res.json(rows[0]);

    } catch (error) {
        next({
            error
        });
    }
}


function deleteLessonQuestions(array_questions, id_lesson) {
    const text = `
        DELETE FROM class_question 
        WHERE (id_question, id_class) 
        IN (SELECT * FROM UNNEST ($1::int[], $2::int[]))`;
    const values = formatWorkspaceArray(array_questions, id_lesson);
    return {
        text,
        values
    }
}

function insertLessonQuestions(array_questions, id_lesson) {
    const text = `
        INSERT INTO class_question (id_question, id_class) 
        SELECT * FROM UNNEST ($1::int[], $2::int[])`;
    const values = formatWorkspaceArray(array_questions, id_lesson);
    return {
        text,
        values
    }
}

function formatWorkspaceArray(array_questions, id_lesson) {
    let values1 = []; //[id_lesson, id_lesson, id_lesson]
    let values2 = []; //[id_question1, id_question2, id_question3]

    array_questions.map((id_question) => {
        values1.push(id_question);
        values2.push(id_lesson);
    });

    return [values1, values2]
}


// Delete a question
const deleteClassQuestion = async (req, res, next) => {

    try {

        const id_class = req.params.classId;
        const id_question = req.params.questionId;

        const text = `
            DELETE FROM class_question 
            WHERE id_class = $1 
            AND id_question = $2`;
        const values = [id_class, id_question]
        await pool.query(text, values);

        res.sendStatus(204);

    } catch (error) {
        next({
            error
        });
    }

}

const getCourseQuestions = async (req, res, next) => {

    try {

        const id_user = req.query.id_user;
        const id_subject = req.query.id_subject;
        const id_course = req.query.id_course;

        const id_category = req.query.id_category || null;
        const id_subcategory = req.query.id_subcategory || null;
        const difficulty = req.query.difficulty || null;

        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        const text = `
        SELECT t1.subject, t1.id_category, t1.category, t1.id_subcategory, t1.subcategory, t1.id_question, t1.question, t1.difficulty, t1.image, t1.updated_at, t2.id_class, t2.class, t2.module, t2.course
        FROM (   
            SELECT su.name AS subject, c.id_category, c.name AS category, s.id_subcategory, s.name AS subcategory, q.id_question, q.description AS question, q.difficulty, q.image, q.updated_at
            FROM questions AS q 
            INNER JOIN subcategories AS s 
            ON q.id_subcategory = s.id_subcategory 
            INNER JOIN categories AS c 
            ON s.id_category = c.id_category 
            INNER JOIN subjects AS su 
            ON c.id_subject = su.id_subject 
            WHERE c.id_user = $1
            AND su.id_subject = $2
        ) AS t1
        LEFT JOIN (
            SELECT q.id_question, cq.id_class, cl.description AS class, m.name AS module, co.name AS course
            FROM questions AS q 
            INNER JOIN class_question AS cq
            ON q.id_question = cq.id_question
            INNER JOIN classes AS cl
            ON cq.id_class = cl.id_class
            INNER JOIN modules AS m 
            ON cl.id_module = m.id_module   
            INNER JOIN courses AS co
            ON m.id_course = co.id_course
            WHERE co.id_course = $3
        ) AS t2
        ON t1.id_question = t2.id_question
        WHERE ($4::int IS NULL OR t1.id_category = $4)
        AND ($5::int IS NULL OR t1.id_subcategory = $5)
        AND ($6::int IS NULL OR t1.difficulty = $6)
        ORDER BY t1.updated_at DESC
        LIMIT $7
        OFFSET $8`;
        const values = [id_user, id_subject, id_course, id_category, id_subcategory, difficulty, page_size, from];
        const {
            rows
        } = await pool.query(text, values);

        // Obtiene la cantidad de registros
        const text2 = `
        SELECT count(*)
        FROM (   
            SELECT su.name AS subject, c.id_category, c.name AS category, s.id_subcategory, s.name AS subcategory, q.id_question, q.description AS question, q.difficulty, q.image, q.updated_at
            FROM questions AS q 
            INNER JOIN subcategories AS s 
            ON q.id_subcategory = s.id_subcategory 
            INNER JOIN categories AS c 
            ON s.id_category = c.id_category 
            INNER JOIN subjects AS su 
            ON c.id_subject = su.id_subject 
            WHERE c.id_user = $1
            AND su.id_subject = $2
        ) AS t1
        LEFT JOIN (
            SELECT q.id_question, cq.id_class, cl.description AS class, m.name AS module, co.name AS course
            FROM questions AS q 
            INNER JOIN class_question AS cq
            ON q.id_question = cq.id_question
            INNER JOIN classes AS cl
            ON cq.id_class = cl.id_class
            INNER JOIN modules AS m 
            ON cl.id_module = m.id_module   
            INNER JOIN courses AS co
            ON m.id_course = co.id_course
            WHERE co.id_course = $3
        ) AS t2
        ON t1.id_question = t2.id_question
        WHERE ($4::int IS NULL OR t1.id_category = $4)
        AND ($5::int IS NULL OR t1.id_subcategory = $5)
        AND ($6::int IS NULL OR t1.difficulty = $6)`;
        const values2 = [id_user, id_subject, id_course, id_category, id_subcategory, difficulty];
        const { count } = (await pool.query(text2, values2)).rows[0];

        res.send({
            info: {
                total_pages: Math.ceil(count / page_size),
                page: page,
                page_size: page_size,
                total_items: parseInt(count),
            },
            items: rows
        });

    } catch (error) {
        next({
            error
        });
    }
}

module.exports = {
    getCourseQuestions,
    getLessonQuestions,
    getAllQuestionsForLesson,
    getQuestionByCourse,
    updateLessonQuestions,
    updateLessonQuestion,
    deleteClassQuestion
}