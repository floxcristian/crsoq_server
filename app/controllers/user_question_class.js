'use strict'

// Load modules
const pool = require('../database');
var socket = require('../../index');

// Obtiene los participantes de una pregunta de clase
const getParticipants = async (req, res, next) => {
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

// Establece un estudiante ganador
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

module.exports = {
    getParticipants,
    setWinnerStudent,
    setLoserStudent,
}