'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const pool = require('../database');
var socket = require('../../index');

async function getEnrollmentsByUserId(req, res, next) {

    try {
        // Query Params
        const id_user = req.params.userId;

        const text1 = `SELECT cu.id_user, cu.id_course, cu.enrolled_at, cu.active, s.id_subject, s.name AS subject, ca.id_calendar, ca.year, ca.semester
        FROM course_user AS cu
        INNER JOIN courses AS c
        ON c.id_course = cu.id_course
        INNER JOIN subjects AS s
        ON s.id_subject = c.id_subject
        INNER JOIN calendars AS ca
        ON c.id_calendar = ca.id_calendar
        WHERE cu.id_user = $1
        AND cu.active = TRUE`
        const values1 = [id_user];
        const res1 = (await pool.query(text1, values1)).rows;

        res.json(res1)

    } catch (error) {
        next({
            error
        });
    }

}

async function createEnrollment(req, res, next) {

    try {
        // Body Params
        const {
            id_user,
            id_course
        } = req.body;

        console.log("create enrollment...: ", id_user, id_course);

        // Query para crear la matrícula
        const text = `INSERT INTO course_user(id_user, id_course) VALUES($1, $2) RETURNING enrolled_at`;
        const values = [id_user, id_course];
        const enrollment_created = (await pool.query(text, values)).rows[0];
        //console.log("enrollment created: ", enrollment_created);


        // Query para obtener toda la data de la matrícula y estudiante que será mandada por socket
        // {id_user, user_name, id_course, course_name, id_subject, subject_name}
        // + Se repite en delete
        const text2 = `SELECT u.id_user, u.name, s.id_subject, s.name AS subject
        FROM users AS u 
        INNER JOIN course_user AS cu 
        ON cu.id_user = u.id_user 
        INNER JOIN courses AS c 
        ON cu.id_course = c.id_course 
        INNER JOIN subjects AS s
        ON c.id_subject = s.id_subject
        WHERE cu.id_user = $1 
        AND cu.id_course = $2`;
        const values2 = [id_user, id_course];
        const {
            rows
        } = await pool.query(text2, values2);

        // Obtiene el websocket
        let io = socket.getSocket();
        // Obtiene los usuarios conectados (en redis después)
        const users_connected = socket.getusersConnected();
        // Busco al usuario en la lista de usuarios conectados
        let user_enrolled = users_connected.filter(user => user.id_user == id_user);
        // Filtro solo los id_socket del usuario
        user_enrolled = user_enrolled.map(user => user.id_socket);

        // Emito el evento a las sesiones del usuario conectado
        // Emite el evento a las sesiones del usuario conectado.
        io.in(user_enrolled).emit('studentEnrolled', rows[0]);
        // Emite evento a los usuarios que estan dentro de la sala
        // + Profesor cuando entra a la sección estudiantes del curso
        io.in(id_course).emit('studentEnrolled', rows[0]);

        // ++ Emito el evento a los profesores también
        // ++ O Emito evento a todos los usuarios que pertenezcan al curso
        //io.in(user_enrolled).emit('studentEnrolled', rows[0]);
        
        
        // Envía respuesta al cliente
        res.send({});

    } catch (error) {
        next({
            error
        });
    }
}

// Inactiva la matrícula (no la elimina) 
async function updateEnrollment(req, res, next) {
    try {
        const id_course = req.params.courseId;
        const id_user = req.params.userId;
        const active = req.body.active;

        const text = `
        UPDATE course_user 
        SET active = $1 
        WHERE id_course = $2 
        AND id_user = $3`;
        const values = [active, id_course, id_user];
        await pool.query(text, values);

        let io = socket.getSocket();
        // Obtiene los usuarios conectados (en redis después)
        const users_connected = socket.getusersConnected();
        // Busco al usuario en la lista de usuarios conectados
        let user_enrolled = users_connected.filter(user => user.id_user == id_user);
        // Filtro solo los id_socket del usuario
        user_enrolled = user_enrolled.map(user => user.id_socket);
         // Emito el evento a las sesiones del usuario conectado.
         // O emito evento a todos los usuarios de la clase???
        // + Necesito enviar el nombre de la asignatura.
        // + ¿Como actualizo el menú?
        io.in(user_enrolled).emit('studentChangeStatusEnrolled', {
            id_user,
            id_course,
            active
        });

        /*
        io.emit('update_enrollment', {
            id_user,
            id_class
        });*/

        res.status(204).send();

    } catch (error) {
        next({ error });
    }
}

async function getEnrollmentsByCourseId(req, res, next) {
    try {
        const id_course = req.params.courseId;
        console.log("getEnrollmentsByCourseId: ", id_course);

        const text1 = `SELECT cs.enrolled_at, cs.active, u.id_user, u.name, u.last_name, u.middle_name, u.document, u.email, u.phone, u.username 
        FROM course_user AS cs 
        INNER JOIN users AS u 
        ON cs.id_user = u.id_user 
        WHERE id_course = $1`;
        const values1 = [id_course];
        const {
            rows
        } = (await pool.query(text1, values1));

        console.log("ENROLLMENTS: ", rows);
        //const res2 = (await pool.query(text2, values2)).rows[0];
        //console.log(res1)
        res.json({
            items: rows
        })

    } catch (error) {
        next({
            error
        });
    }
}




async function getCountEnrollments() {

}

async function deleteEnrollment(req, res, next) {
    try {

        const id_course = req.params.courseId;
        const id_user = req.params.userId;

        const text = 'DELETE FROM course_user WHERE id_course = $1 AND id_user = $2';
        const values = [id_course, id_user];
        await pool.query(text, values);


        // Revisar que parámetros necesito realmente
        const text2 = `SELECT s.id_subject, s.name AS subject
        FROM courses AS c
        INNER JOIN subjects AS s
        ON c.id_subject = s.id_subject
        WHERE c.id_course = $1`;
        const values2 = [id_course];
        const {
            rows
        } = await pool.query(text2, values2);

        console.log("deleted: ", rows);
        // Obtiene el websocket
        let io = socket.getSocket();
        // Obtiene los usuarios conectados (en redis)
        const users_connected = socket.getusersConnected();
        // Busca al usuario en la lista de usuarios conectados
        let user_enrolled = users_connected.filter(user => user.id_user == id_user);
        // Filtra solo los id_socket del usuario
        user_enrolled = user_enrolled.map(user => user.id_socket)
        // Emite el evento a las sesiones del usuario conectado.
        io.in(user_enrolled).emit('studentEnrollmentDeleted', rows[0]);
        // Emite evento a los usuarios que estan dentro de la sala
        // + Profesor cuando entra a la sección estudiantes del curso
        io.in(id_course).emit('studentEnrollmentDeleted', rows[0])

        res.sendStatus(204);
    } catch (error) {
        next({
            error
        });
    }
}

// Función para obtener la data que será enviada por socket
// + Pendiente: Sacar las funciones de create y delete
async function getDataEnrollment() {

}


// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {

    getEnrollmentsByCourseId,
    getEnrollmentsByUserId,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    // countCalendar
}