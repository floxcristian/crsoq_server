'use strict'

// Load modules
const pool = require('../database');
var socket = require('../../index');

// Obtiene participantes de una pregunta de clase
const getStudents = async (req, res, next) => {
    try {
        const {
            id_class,
            id_question
        } = req.query;

        const text = `
            SELECT *
            FROM user_question_class AS uqc
            INNER JOIN users AS u
            ON u.id_user = uqc.id_user
            WHERE id_class = $1
            AND id_question = $2`;
        const values = [id_class, id_question];
        const { rows } = await pool.query(text, values);
        res.json(rows);
    } catch (error) {
        next({
            error
        });
    }
}


// Actualiza el estado de un participante
const updateParticipantStatus = async (req, res, next) => {

    try {
        const {
            id_user,
            id_class,
            id_question,
            status
        } = req.body;

        // Obtiene los asistentes de la clase
        let attendes = socket.getStudentsInClassroom(id_class);
        // Busca al estudiante entre los asistentes
        let index_student = attendes.findIndex(attende => attende.id_user == id_user);
        // Actualiza el estado del estudiante (si lo encuentra)
        if (index_student >= 0) attendes[index_student].participation_status = status; 

        // Obtiene los participantes
        let participants = socket.getStudentParticipants(id_class);
        // Busca al perdedor entre los participantes
        let index_student = participants.findIndex(participant => participant.id_user == id_user);
        // Actualiza el estado del estudiante (si lo encuentra)
        if (index_student >= 0) participants[index_student].status = status; 

        const new_question_status = 0; //>

        // Obtiene el websocket
        let io = socket.getSocket();
        // Emite a los estudiantes de la sala (se incluye) que un estudiante cambio de estado
        io.in(id_class + 'play-question-section')
            .emit('studentHasEnteredToTheClassroom', {
                type: 2,
                detail: 'UPDATE_STUDENT_STATUS',
                id_user: id_user,
                update_student_status: status,
                update_question_status: new_question_status
            });

        res.json({
            message: 'successfully update status'
        });

    } catch (error) {
        next({
            error
        });
    }
}

// Establece un estudiante perdedor
const setLoserStudent = async (req, res, next) => {

    try {
        const {
            student,
            id_class,
            id_question,
            status
        } = req.body;
        const { id_user } = student;

        // Obtiene los asistentes de la clase
        let attendes = socket.getStudentsInClassroom(id_class);
        // Busca al estudiante entre los asistentes
        let index_student = attendes.findIndex(attende => attende.id_user == id_user);
        // Actualiza el estado del estudiante (si lo encuentra)
        if (index_student >= 0) attendes[index_student].participation_status = status; 

        // Obtiene los participantes
        let participants = socket.getStudentParticipants(id_class);
        // Busca al perdedor entre los participantes
        let index_student = participants.findIndex(participant => participant.id_user == id_user);
        // Actualiza el estado del estudiante (si lo encuentra)
        if (index_student >= 0) participants[index_student].status = status; 

        // Obtiene el websocket
        let io = socket.getSocket();
        // Emite a los estudiantes de la sala (se incluye) que un estudiante cambio de estado
        io.in(id_class + 'play-question-section')
            .emit('studentHasEnteredToTheClassroom', {
                type: 2,
                detail: 'UPDATE_STUDENT_STATUS',
                id_user: id_user,
                update_student_status: status,
                update_question_status: 3 // status 'seleccionando un estudiante'
            });

        res.json({
            message: 'successfully update status'
        });

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

/*
Inserta el estado de cada estudiante participante
        const text = `
            INSERT INTO user_question_class(id_user, id_class, id_question, status)
            SELECT * FROM UNNEST ($1::int[], $2::int[], $3::int[], $4::int[])`;
        const values = formatStudentValues(attendes, id_class, id_question);
        await pool.query(text, values);
*/

// Establece un estudiante ganador
// + Si ningún estudiante gana entonces no se establecen los estados de todos los participantes
const setWinnerStudent = async (req, res, next) => {
    try {

        const {
            winner_student, //>
            id_class,
            id_question
        } = req.body;
        const { id_user } = winner_student; //>

        // Obtiene los asistentes de la clase
        let attendes = socket.getStudentsInClassroom(id_class);
        // Busca al estudiante entre los asistentes
        let index_student = attendes.findIndex(attende => attende.id_user == id_user);
        // Actualiza el estado del estudiante (si lo encuentra)
        if (index_student >= 0) attendes[index_student].participation_status = 5; //> 

        // Obtiene el websocket
        let io = socket.getSocket();
        // Emite a los estudiantes de la sala (se incluye) que un estudiante cambio de estado
        io.in(id_class + 'play-question-section')
            .emit('studentHasEnteredToTheClassroom', {
                type: 2,
                detail: 'UPDATE_STUDENT_STATUS',
                id_user: id_user,
                update_student_status: 5, // status 'ganador'
                update_question_status: 5 // status 'sesión finalizada'
            });

        res.json({
            message: 'successfully update status'
        });

    } catch (error) {
        next({
            error
        });
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
        //> Ojo aquí
        if (student.participation_status == 3) values4.push(2);
        else if (student.participation_status == 4) values4.push(3);
        else if (student.participation_status == 5) values4.push(4);
        else values4.push(student.participation_status);
    });
    return [values1, values2, values3, values4];
}

module.exports = {
    getStudents,
    setWinnerStudent,
    setLoserStudent,
}