'use strict'

// Load modules
const pool = require('../database');
const socket = require('../../index');

// Crea una actividad
const createActivity = async (req, res, next) => {

    try {
        const {
            id_lesson,
            name,
            mode
        } = req.body;

        // Crea una actividad
        const text = `
            INSERT INTO activities(id_class, name, mode) 
            VALUES($1, $2, $3)`;
        const values = [id_lesson, name, mode];
        await pool.query(text, values);

        // Obtiene el 'id_course' en base al 'id_class'
        const text2 = `
            SELECT m.id_course 
            FROM modules AS m
            INNER JOIN classes AS c
            ON m.id_module = c.id_module
            WHERE c.id_class = $1`;
        const values2 = [id_lesson];
        const { id_course } = (await pool.query(text2, values2)).rows[0];

        let io = socket.getSocket(); // Obtiene el websocket

        // Emite evento a la 'room' ${id_course+'class-section-room'}`
        io.in(id_course + 'activity-section-room').emit('activityCreated');

        //res.sendStatus(201); // Error: Unexpected token JSON at position 0
        res.status(201).send(); // Funciona
    } catch (error) {
        next({
            error
        });
    }
}


// Obtiene las actividades
const getActivities = async (req, res, next) => {

    try {
        const { id_course } = req.query;
        const mode = req.query.mode || null;
        const status = req.query.status || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        const from = (page - 1) * page_size; // Calcula el 'from' a partir de los params 'page' y 'page_size'

        // Obtiene las Actividades por ID Curso (parámetros de filtro opcionales)
        // En una parte utiliza status = 2 para mostrar si en una actividad hubieron ganadores
        const text = `
            SELECT a.id_activity, a.name, a.mode, a.status, a.created_at, a.updated_at, c.id_class, c.description AS lesson, m.id_module, m.name AS module, 
            CASE WHEN EXISTS (
                SELECT id_user 
                FROM activity_user AS au 
                WHERE id_activity = a.id_activity 
                AND status = 2
            ) THEN TRUE ELSE FALSE END AS winners 
            FROM activities AS a 
            INNER JOIN classes AS c 
            ON c.id_class = a.id_class 
            INNER JOIN modules AS m 
            ON m.id_module = c.id_module 
            WHERE id_course = $1 
            AND ($2::int is null or a.mode = $2) 
            AND ($3::int is null or a.status = $3) 
            LIMIT $4 OFFSET $5`;
        const values = [id_course, mode, status, page_size, from];
        const {
            rows
        } = await pool.query(text, values);

        // Obtiene la cantidad total de actividades por 'id_course' (parámetros de filtro opcionales)
        const text2 = `
            SELECT count(*) 
            FROM activities 
            WHERE id_class 
            IN (
                SELECT id_class 
                FROM classes 
                WHERE id_module 
                IN (
                    SELECT id_module 
                    FROM modules 
                    WHERE id_course = $1
                )
            ) AND ($2::int is null OR mode = $2) 
            AND ($3::int is null or status = $3)`;
        const values2 = [id_course, mode, status];
        const { count } = (await pool.query(text2, values2)).rows[0];

        res.json({
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

// Actualiza una actividad
const updateActivity = async (req, res, next) => {

    try {
        const client = await pool.pool.connect();

        const id_activity = parseInt(req.params.id_activity);
        const id_class = req.body.id_lesson; //>
        const {
            name,
            mode,
            status,
            add_winners, 
            delete_winners
        } = req.body;

        // Verifica si el estado de la actividad cambio
        const text3 = `
            SELECT status 
            FROM activities 
            WHERE id_activity = $1`;
        const values3 = [id_activity];
        const original_status = (await pool.query(text3, values3)).rows[0];

        // Obtiene el 'id_course' y el 'subject' para emitir el evento a la sala del curso
        const text4 = `
            SELECT m.id_course, s.name AS subject 
            FROM modules AS m
            INNER JOIN classes AS cl
            ON cl.id_module = m.id_module
            INNER JOIN courses AS c
            ON m.id_course = c.id_course
            INNER JOIN subjects AS s
            ON c.id_subject = s.id_subject
            WHERE id_class = $1`;
        const values4 = [id_class];
        const {
            id_course,
            subject
        } = (await pool.query(text4, values4)).rows[0];

        client.query('BEGIN'); // Inicia la transacción
        let promises = []; // Array para ejecutar consultas en paralelo

        // Actualiza los datos de la actividad
        if (id_class && name && mode && status != undefined) {
            const text = `
                UPDATE activities 
                SET id_class = $1, name = $2, mode = $3, status = $4 
                WHERE id_activity = $5`;
            const values = [id_class, name, mode, status, id_activity];
            promises.push(client.query(text, values)); // Agrega la query al array 'promises'
        }

        // Actualiza la participación en la actividad
        /*if (array_participation.length > 0) {
            const {
                text2,
                values2
            } = updateParticipation(id_activity, array_participation);
            promises.push(client.query(text2, values2)); // Agrega la query al array 'promises'
        }*/

        if (add_winners && add_winners.length > 0) {
            const {
                text,
                values
            } = insertWinners(add_winners, id_activity);
            // Agrega la query al array 'promises'
            promises.push(client.query(text, values));
        }

        if (delete_winners && delete_winners.length > 0) {
            const {
                text,
                values
            } = deleteWinners(delete_winners, id_activity);
            promises.push(client.query(text, values));
        }

        await Promise.all(promises); // Ejecuta consultas en paralelo
        await client.query('COMMIT'); // Finaliza la transacción
        let io = socket.getSocket(); // Obtiene el websocket

        // Emite evento a todos los estudiantes que esten en la sección de clases de este curso.
        io.in(id_course + 'activity-section-room').emit('activityUpdated');

        // Si el estado de la actividad es 2 (iniciada) y cambia, se le notifica a los estudiantes del curso.
        if (status == 2 && original_status != status) {
            console.log(" + notifica a estudiantes el inicio de una actividad");

            io.in(id_course + 'students').emit('activityStarted', {
                id_course,
                subject
            });
        }

        res.sendStatus(204);
    } catch (error) {
        next({
            error
        });
    }

}

// Obtiene los estudiantes que participaron en una actividad
const getStudentsByActivityID = async (req, res, next) => {

    try {
        const { id_activity } = req.query;

        // Obtiene el 'id_course' a partir del 'id_activity'
        const text = `
            SELECT m.id_course
            FROM activities AS a
            INNER JOIN classes AS c
            ON a.id_class = c.id_class
            INNER JOIN modules AS m
            ON c.id_module = m.id_module
            WHERE a.id_activity = $1`;
        const values = [id_activity];
        const { id_course } = (await pool.query(text, values)).rows[0];
        
        // Obtiene los estudiantes inscritos al curso
        const text2 = `
            SELECT u.id_user, u.name, u.last_name, u.middle_name, u.document, u.username 
            FROM course_user AS cs 
            INNER JOIN users AS u 
            ON cs.id_user = u.id_user 
            WHERE cs.id_course = $1
            AND u.active = true`;
        const values2 = [id_course];
        const enrolled_students = (await pool.query(text2, values2)).rows;

        // Obtiene los estudiantes ganadores de la actividad
        const text3 = `
            SELECT u.id_user, u.name, u.last_name, u.middle_name, u.document, au.status 
            FROM activity_user AS au 
            INNER JOIN users AS u 
            ON au.id_user = u.id_user 
            WHERE id_activity = $1`;
        const values3 = [id_activity];
        const participant_students = (await pool.query(text3, values3)).rows;
        console.log("participant_students: ", participant_students);

        enrolled_students.map(student => {
            student.status = 1;
            let participant = participant_students.find(participant => participant.id_user == student.id_user);
            if(participant) student.status = participant.status;
        });

        res.json(enrolled_students);
    } catch (error) {
        next({
            error
        });
    }
}

// Elimina una actividad
const deleteActivity = async (req, res, next) => {

    try {
        const { id_activity } = req.params;

        const text = `
            DELETE FROM activities 
            WHERE id_activity = $1 
            RETURNING id_class`;
        const values = [id_activity];
        const { id_class } = (await pool.query(text, values)).rows[0];

        // Obtiene el 'id_course' a partir del 'id_class'
        const text2 = `
            SELECT m.id_course 
            FROM modules AS m
            INNER JOIN classes AS c
            ON m.id_module = c.id_module
            WHERE c.id_class = $1`;
        const values2 = [id_class];
        const { id_course } = (await pool.query(text2, values2)).rows[0];

        let io = socket.getSocket(); // Obtiene el websocket
        // Emite evento a la sala: ${id_course+'class-section-room'}`)
        io.in(id_course + 'activity-section-room').emit('activityDeleted');

        res.sendStatus(204);
    } catch (error) {
        next({
            error
        });
    }
}



// Actualiza la participación en una actividad
const updateParticipation = async (id_activity, array_participation) => {
    // array_participation: {id_user, status}

    // Actualizar múltiples registros en una query: https://stackoverflow.com/questions/37048772/update-multiple-rows-from-multiple-params-in-nodejs-pg
    // Actualizar múltiples registros pasando un array de objetos: https://stackoverflow.com/questions/37059187/convert-object-array-to-array-compatible-for-nodejs-pg-unnest

    // Inserta el 'id_activity' en cada registro (Object) del array 'array_participation'
    array_participation.map(participation => Object.assign(participation, {
        id_activity
    }));
    // [ {id_user, id_activity, status} ]

    // Actualiza múltiples registros
    const text2 = `
        UPDATE activity_user AS au 
        SET status = s.status 
        FROM (
            SELECT (a->>'id_activity')::int AS id_activity, (a->>'id_user')::int AS id_user, (a->>'status')::int AS status
            FROM (
                SELECT jsonb_array_elements(a) AS a
                FROM (values (($1)::jsonb)) s(a)
            ) AS s 
        ) AS s
        WHERE au.id_activity = s.id_activity 
        AND au.id_user = s.id_user`;
    const values2 = [JSON.stringify(array_participation)];
    return {
        text2,
        values2
    }
}


const deleteWinners = (array_students, id_activity) => {
    const text = `
        DELETE FROM activity_user 
        WHERE (id_user, id_activity) 
        IN (SELECT * FROM UNNEST ($1::int[], $2::int[]))`;
    const values = formatWorkspaceArray(array_students, id_activity, 1);
    return {
        text,
        values
    }
}


const insertWinners = (array_students, id_activity) => {
    const text = `
        INSERT INTO activity_user (id_user, id_activity, status) 
        SELECT * FROM UNNEST ($1::int[], $2::int[], $3::int[])`;
    const values = formatWorkspaceArray(array_students, id_activity, 2);
    return {
        text,
        values
    }
}

const formatWorkspaceArray = (array_students, id_activity, status) => {
    let values1 = []; //[id_user1, id_user2, id_user3]
    let values2 = []; //[id_activity, id_activity, id_activity]
    let values3 = []; //[status, status, status]

    array_students.map((id_user) => {
        values1.push(id_user);
        values2.push(id_activity);
        if(status == 2) values3.push(status);
    });

    if(status == 2) return [values1, values2, values3];
    else return [values1, values2];
}

module.exports = {
    getActivities,
    getStudentsByActivityID,
    createActivity,
    updateActivity,
    deleteActivity,
}