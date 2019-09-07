'use strict'

// Load modules
const colors = require('colors');
const pool = require('../database');
const _file = require('../services/file');
var socket = require('../../index');


// Obtiene las preguntas que ya han sido agregadas a cierta clase
// + Enviar atributo winners: true/false
const getLessonQuestions = async (req, res, next) => {

    try {
        const { id_lesson } = req.query;
        const id_category = req.query.id_category || null;
        const id_subcategory = req.query.id_subcategory || null;
        const difficulty = req.query.difficulty || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

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
                AND status = 5
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

const getSummaryStudentParticipation = async (req, res, next) => {
    try {
        const { id_user, id_lesson } = req.query;

        /*
        // Obtener el 'id_course' a partir del 'id_lesson'
        let promises = []; // Array para ejecutar consultas en paralelo

        // Total de preguntas realizadas en una clase
        const text = `
            SELECT count(*)
            FROM class_question
            WHERE id_class = $1
            AND status = 5`;
        const values = [id_lesson];
        promises.push(client.query(text, values)); // Agrega la query al array 'promises'

        // Total de 'participaciones' de un estudiante en una clase
        const text2 = `
            SELECT count(*)
            FROM user_question_class AS uqc
            INNER JOIN class_question AS cq
            ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
            WHERE uqc.id_class = $1
            AND uqc.id_user = $2
            AND uqc.status != 1
            AND cq.status = 5`;
        const values2 = [id_lesson, id_user];
        promises.push(client.query(text2, values2)); // Agrega la query al array 'promises'

        // Total de 'no participaciones' de un estudiante en una clase
        const text3 = `
            SELECT count(*)
            FROM user_question_class AS uqc
            INNER JOIN class_question AS cq
            ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
            WHERE uqc.id_class = $1
            AND uqc.id_user = $2
            AND uqc.status = 1
            AND cq.status = 5`;
        const values3 = [id_lesson, id_user];
        promises.push(client.query(text3, values3)); // Agrega la query al array 'promises'

        // Total de 'ganadas' de un estudiante en una clase
        const text4 = `
            SELECT count(*)
            FROM user_question_class AS uqc
            INNER JOIN class_question AS cq
            ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
            WHERE uqc.id_class = $1
            AND uqc.id_user = $2
            AND uqc.status = 5
            AND cq.status = 5`;
        const values4 = [id_lesson, id_user];
        promises.push(client.query(text4, values4)); // Agrega la query al array 'promises'

        // Total de 'perdidas' de un estudiante en una clase
        const text5 = `
            SELECT count(*)
            FROM user_question_class AS uqc
            INNER JOIN class_question AS cq
            ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
            WHERE uqc.id_class = $1
            AND uqc.id_user = $2
            AND uqc.status = 4
            AND cq.status = 5`;
        const values5 = [id_lesson, id_user];
        promises.push(client.query(text5, values5)); // Agrega la query al array 'promises'

        // Total de 'no seleccionado' de un estudiante en una clase
        const text6 = `
            SELECT count(*)
            FROM user_question_class AS uqc
            INNER JOIN class_question AS cq
            ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
            WHERE uqc.id_class = $1
            AND uqc.id_user = $2
            AND uqc.status = 2
            AND cq.status = 5`;
        const values6 = [id_lesson, id_user];
        promises.push(client.query(text6, values6)); // Agrega la query al array 'promises'

        // Total de preguntas realizadas en el semestre para un curso
        const text7 = `
            SELECT count(*)
            FROM class_question AS cq
            INNER JOIN classes AS c
            ON cq.id_class = c.id_class
            INNER JOIN modules AS m
            ON c.id_module = m.id_module
            WHERE m.id_course = $1 
            AND cq.status = 5`;
        const values7 = [id_course];
        promises.push(client.query(text7, values7)); // Agrega la query al array 'promises'

        // Total de 'participaciones' de un estudiante en un curso
        const text7 = `
            SELECT count(*)
            FROM user_question_class AS uqc
            INNER JOIN class_question AS cq
            ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
            INNER JOIN classes AS c
            ON cq.id_class = c.id_class
            INNER JOIN modules AS m
            ON c.id_module = m.id_module
            WHERE m.id_course = $1
            AND cq.status = 5
            AND uqc.id_user = $2
            AND uqc.status != 1`;
        const values7 = [id_course, id_user];

        // Total de 'no participaciones' de un estudiante en un curso
        const text8 = `
            SELECT count(*)
            FROM user_question_class AS uqc
            INNER JOIN class_question AS cq
            ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
            INNER JOIN classes AS c
            ON cq.id_class = c.id_class
            INNER JOIN modules AS m
            ON c.id_module = m.id_module
            WHERE m.id_course = $1
            AND cq.status = 5
            AND uqc.id_user = $2
            AND uqc.status = 1`;
        const values8 = [id_course, id_user];
        promises.push(client.query(text8, values8)); // Agrega la query al array 'promises'

        // Total de 'ganadas' de un estudiante en un curso
        const text9 = `
            SELECT count(*)
            FROM user_question_class AS uqc
            INNER JOIN class_question AS cq
            ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
            INNER JOIN classes AS c
            ON cq.id_class = c.id_class
            INNER JOIN modules AS m
            ON c.id_module = m.id_module
            WHERE m.id_course = $1
            AND cq.status = 5
            AND uqc.id_user = $2
            AND uqc.status = 5`;
        const values9 = [id_course, id_user];
        promises.push(client.query(text9, values9)); // Agrega la query al array 'promises'

        // Total de 'perdidas' de un estudiante en un curso
        const text10 = `
            SELECT count(*)
            FROM user_question_class AS uqc
            INNER JOIN class_question AS cq
            ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
            INNER JOIN classes AS c
            ON cq.id_class = c.id_class
            INNER JOIN modules AS m
            ON c.id_module = m.id_module
            WHERE m.id_course = $1
            AND cq.status = 5
            AND uqc.id_user = $2
            AND uqc.status = 4`;
        const values10 = [id_course, id_user];
        promises.push(client.query(text10, values10)); // Agrega la query al array 'promises'

        // Total de 'no seleccionado' de un estudiante en un curso
        const text11 = `
            SELECT count(*)
            FROM user_question_class AS uqc
            INNER JOIN class_question AS cq
            ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
            INNER JOIN classes AS c
            ON cq.id_class = c.id_class
            INNER JOIN modules AS m
            ON c.id_module = m.id_module
            WHERE m.id_course = $1
            AND cq.status = 5
            AND uqc.id_user = $2
            AND uqc.status = 2`;
        const values11 = [id_course, id_user];
        promises.push(client.query(text11, values11)); // Agrega la query al array 'promises'

        const rows = await Promise.all(promises); // Ejecuta consultas en paralelo
        console.log("rows: ", rows);
        */
    } catch (error) {
        next({
            error
        });
    }
}


// Obtiene las preguntas de la biblioteca de la asignatura e indica cuales han sido agregadas a la clase.
async function getAllQuestionsForLesson(req, res, next) {
    try {
        const { id_user, id_subject, id_lesson } = req.query;

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

const getQuestionByCourse = async (req, res, next) => {

    try {
        const {
            id_course
        } = req.params;
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
        const {
            count
        } = (await pool.query(text2, values2)).rows[0];

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

// Crea o elimina múltiples preguntas en una clase
// + Asegurarse que una pregunta no este en otra clase?
const updateLessonQuestions = async (req, res, next) => {
    const client = await pool.pool.connect();

    try {
        const {
            id_lesson,
            add_questions,
            delete_questions
        } = req.body;

        client.query('BEGIN'); // Inicia la transacción
        let promises = []; // Array para ejecutar consultas en paralelo

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

        await Promise.all(promises);

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

const formatStudentValues = (array_students, id_class, id_question) => {
    let values1 = []; // [id_user1, id_user2, id_user3]
    let values2 = []; // [id_class, id_class, id_class]
    let values3 = []; // [id_question, id_question, id_question]
    let values4 = []; // [status1, status2, status3] 

    array_students.map((student) => {
        values1.push(student.id_user);
        values2.push(id_class);
        values3.push(id_question);
        // Formatea los estados
        switch (student.status) {
            case 2:
            case 4:
            case 5:
                values4.push(student.status);
                break;
            case 3:
                values4.push(2);
                break;
            default:
                values4.push(1);
        }
    });
    return [values1, values2, values3, values4];
}


// Actualiza el estado de una pregunta de una clase
// + Estados: 1: no iniciada, 2: iniciada, 3: detenida, 4: respondiendo , 5: finalizada
const updateLessonQuestion = async (req, res, next) => {

    

    try {
        const {
            status
        } = req.body;
        const {
            id_class,
            id_question
        } = req.params;

        let participants_overview;

        if (status == 1) { // Reinicia una pregunta (status 'no iniciada')

            // Elimina registros de participación de la pregunta
            const text = `
                DELETE FROM user_question_class
                WHERE id_question = $1
                AND id_class = $2`;
            const values = [id_question, id_class];
            await pool.query(text, values);
            // Elimina participantes de la variable 'participants_of_a_question'
            socket.setParticipants(id_class, []);

        } else if (status == 2) { // Inicia una pregunta (status 'iniciada')

            // Verifica que no halla otra pregunta 'iniciada' o 'detenida' en la clase
            const text = `
                SELECT CASE WHEN EXISTS (
                    SELECT status 
                    FROM class_question
                    WHERE id_class = $1
                    AND id_question != $2
                    AND (status = 2 OR status = 3)
                ) THEN TRUE ELSE FALSE END AS any_question_started`;
            const values = [id_class, id_question];
            const {
                any_question_started
            } = (await pool.query(text, values)).rows[0];

            // Si ya hay una pregunta iniciada en la clase envia 'null' para que no se inicie la pregunta
            if (any_question_started) return res.send(null);

        } else if (status == 5) { // Finaliza una pregunta (status 'finalizada')

            // Obtiene los participantes
            const participants = socket.getStudentParticipants(id_class);
            console.log("participants: ", participants);
            // Obtiene el 'id_course' a partir del 'id_class'
            const text = `
                SELECT m.id_course
                FROM modules AS m
                INNER JOIN classes AS c
                ON m.id_module = c.id_module
                WHERE c.id_class = $1`;
            const values = [id_class];
            const { id_course } = (await pool.query(text, values)).rows[0];

            // Obtiene los estudiantes inscritos al curso
            const text2 = `
                SELECT id_user
                FROM course_user
                WHERE id_course = $1`;
            const values2 = [id_course];
            const enrolled_students = (await pool.query(text2, values2)).rows;

            console.log("enrolled students: ", enrolled_students);


            
            participants.forEach((participant) => {

                // Verifica si el estudiante participó
                const index_student = enrolled_students.findIndex(student => student.id_user == participant.id_user);
                // Elimina al estudiante participante (si participó)
                if (index_student >= 0) enrolled_students.splice(index_student, 1);
            });

            // Incorporá a los estudiantes que no participarón
            enrolled_students.forEach((student) => {
                participants.push({
                    id_user: student.id_user,
                    status: 1
                });
            });

            // Inserta el estado de cada estudiante participante
            const text3 = `
                INSERT INTO user_question_class(id_user, id_class, id_question, status)
                SELECT * FROM UNNEST ($1::int[], $2::int[], $3::int[], $4::int[])`;
            const values3 = formatStudentValues(participants, id_class, id_question);
            await pool.query(text3, values3);

            // Obteniene un resumen de participación
            const total = participants.length;
            const no_selected = participants.filter(student => (student.status === 2 || student.status == 3)).length;
            const losers = participants.filter(student => student.status === 4).length;
            const winner = participants.find(student => student.status == 5) || null;
            const winner_name = winner ? (`${winner.name} ${winner.last_name} ${winner.middle_name}`) : '--';

            participants_overview = {
                no_selected, losers, winner_name, total
            };

            // Elimina participantes de la variable 'participants_of_a_question'
            socket.setParticipants(id_class, []);
            // Actualiza el estado de los estudiantes en clase 'students_in_classrooms' a 'en espera' (status 1) 
            socket.resetStudentsInClassroomStatus(id_class);
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

        // Obtiene datos adicionales de la pregunta
        const text3 = `
            SELECT id_question, difficulty, description, image 
            FROM questions
            WHERE id_question = $1`;
        const values3 = [id_question];
        const question = (await pool.query(text3, values3)).rows[0];
        question.status = status; // Establece el estado actual de la pregunta

        let io = socket.getSocket(); // Obtiene el socket

        if (status != 1) {
            console.log("go ctma");
            // Emite la pregunta a los estudiantes que esten en la sección de juego de la clase
            io.in(id_class + 'play-question-section').emit('studentHasEnteredToTheClassroom', {
                type: 3,
                detail: 'UPDATE_QUESTION_STATUS',
                question: question,
                participants_overview: participants_overview || {}
            });
        }


        // Si se ha iniciado una pregunta y el estado actualizado es diferente al estado original 
        if (status == 2 && original_status != status) {

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

            // Emiter: indica a estudiantes del curso que se inició una pregunta
            io.in(id_course + 'students').emit('classQuestionStarted', {
                id_course,
                subject
            });

        }

        res.json(rows[0]);

    } catch (error) {
        next({
            error
        });
    }
}


const deleteLessonQuestions = (array_questions, id_lesson) => {
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

const insertLessonQuestions = (array_questions, id_lesson) => {
    const text = `
        INSERT INTO class_question (id_question, id_class) 
        SELECT * FROM UNNEST ($1::int[], $2::int[])`;
    const values = formatWorkspaceArray(array_questions, id_lesson);
    return {
        text,
        values
    }
}

const formatWorkspaceArray = (array_questions, id_lesson) => {
    let values1 = []; //[id_question1, id_question2, id_question3]
    let values2 = []; //[id_lesson, id_lesson, id_lesson]

    array_questions.map((id_question) => {
        values1.push(id_question);
        values2.push(id_lesson);
    });

    return [values1, values2];
}


// Elimina una pregunta asignada a una clase
const deleteClassQuestion = async (req, res, next) => {
    try {
        const {
            id_class,
            id_question
        } = req.params;
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

        const { id_user, id_subject, id_course } = req.query;

        const id_category = req.query.id_category || null;
        const id_subcategory = req.query.id_subcategory || null;
        const difficulty = req.query.difficulty || null;

        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        //>
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
        const {
            count
        } = (await pool.query(text2, values2)).rows[0];

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
    deleteClassQuestion,
    getSummaryStudentParticipation
}