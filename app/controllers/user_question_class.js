// Debiese tener un solo array de estudiantes y cada uno tener un estado.
// + 1: asiste, 2: participa, 3: gana, 4: pierde.
// + Podría mandar arrays filtrados al cliente, por ejemplo, un array de los participantes.
// + Otra opción de estados: 1: en espera, 2: desea responder, 3: seleccionado para responder, 4: perdío, 5: gano.
// + 1: asistente(1), 2:participa pero no es seleccionado (2,3), 3: pierde(4), 4: gana(5)

'use strict'


// Load modules
//const bcrypt = require('bcrypt-nodejs');
const pool = require('../database');
var socket = require('../../index');

const getStudents = async(req, res, next) => {
    
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

        res.json(rows)
    
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
            loser_student,
            id_class,
            id_question
        } = req.body;
        const { id_user } = loser_student;

        let asistentes = socket.getStudentsInClassroom(id_class); // Obtiene a los asistentes de la clase
        // Busca al perdedor entre los asistentes
        let index_perdedor = asistentes.findIndex(asistente => asistente.id_user == id_user); 
        // Actualiza el estado del estudiante a 'perdedor' (si lo encuentra)
        if (index_perdedor >= 0) asistentes[index_perdedor].participation_status = 4; 

        // Obtiene los participantes
        let participants = socket.getStudentParticipants(id_class);
        // Busca al perdedor entre los participantes
        let index_student = participants.findIndex(participant => participant.id_user == id_user);
        // Actualiza el estado del participante a 'perdedor' (si lo encuentra)
        if(index_student >= 0) participants[index_student].status = 4;

        console.log("nopoe: ", socket.getStudentsInClassroom(id_class));
        // Inserta al estudiante perdedor en la base de datos
        const text = `
            INSERT INTO user_question_class(id_user, id_class, id_question, status) 
            VALUES($1, $2, $3, 3) 
            ON CONFLICT ON CONSTRAINT pk_user_question_class DO UPDATE SET status = 3, update_date = DEFAULT`;
        const values = [id_user, id_class, id_question];
        await pool.query(text, values);

        let io = socket.getSocket(); // Obtiene el websocket
        // Emite a los estudiantes de la sala (se incluye) que un estudiante perdío
        io.in(id_class + 'play-question-section')
            .emit('studentHasEnteredToTheClassroom', {
                type: 2,
                detail: 'UPDATE_STUDENT_STATUS',
                id_user: id_user,
                update_student_status: 4, // status 'perdedor'
                update_question_status: 3 // status 'seleccionando un estudiante'
            }); 

        //let participantes = socket.getStudentParticipants(id_class);
        res.json({
            message: 'successfully update status'
        });

    } catch (error) {
        next({
            error
        });
    }
}


// Establece un estudiante ganador
const setWinnerStudent = async(req, res, next) => {
    try {

        const {
            winner_student,
            id_class,
            id_question
        } = req.body;
        const { id_user } = winner_student;

        // Inserto el estudiante ganador en la base de datos.
        // + Para evitar errores podría hacer que lo cree o lo actualice si ya existe con ON CONFLICT.
        // const text = `
        //     INSERT INTO user_question_class(id_user, id_class, id_question, status) 
        //     VALUES($1, $2, $3, 2) 
        //     ON CONFLICT ON CONSTRAINT pk_user_question_class DO UPDATE SET status = 3, update_date = DEFAULT`;

        // const values = [id_user, id_class, id_question];
        // const {
        //     rows
        // } = await pool.query(text, values);

        // Modifico el array global de estudiantes del curso.
        let asistentes = socket.getStudentsInClassroom(id_class);
        let index_ganador = asistentes.findIndex(asistente => asistente.id_user == id_user);
        if (index_ganador >= 0) asistentes[index_ganador].participation_status = 5;


        // Obtengo los estudiantes que perdieron (desde la base de datos).
        // + No es necesario obtener los perdedores, ya se quienes son con el estado del array.
        // const text2 = `SELECT * FROM user_question_class WHERE id_class = $1 AND id_question = $2 AND status = 3`;
        // const values2 = [id_class, id_question];
        // const estudiantes_perdedores = (await pool.query(text2, values2)).rows;
        // console.log("ESTUDIANTES PERDEDORES: ", estudiantes_perdedores);

        // Obtengo los estudiantes participantes pero no seleccionados.
        // let no_seleccionados = asistentes.filter(student => {
        //     return (student.participation_status == 2)
        // });

        // Obtengo los estudiantes que sólo estuvieron presente en la sala.
        // let no_participantes = asistentes.filter(student => {
        //     return student.participation_status == 1
        // });


        // Inserta varios registros
        const text = `
            INSERT INTO user_question_class(id_user, id_class, id_question, status)
            SELECT * FROM UNNEST ($1::int[], $2::int[], $3::int[], $4::int[])`;
        const values = formatStudentValues(asistentes, id_class, id_question);
        await pool.query(text, values);

        /* 
        const text = `
        INSERT INTO class_question (id_question, id_class) 
        SELECT * FROM UNNEST ($1::int[], $2::int[])`;
        */

        // Inserto el resto de los estudiantes
        // + Obtener el array global.


        //console.log("ROWS: ", rows);

        
        let io = socket.getSocket(); // Obtiene el websocket
        // Emite a los estudiantes de la sala (se incluye) que un estudiante ganó
        io.in(id_class + 'play-question-section')
            .emit('studentHasEnteredToTheClassroom', {
                type: 2,
                id_user: id_user,
                update_student_status: 5, // status 'ganador'
                update_question_status: 5 // status 'sesión finalizada'
            });



        //let participantes = socket.getStudentParticipants(id_class);
        //console.log("PARTICIPANTS: ", participants);
        res.json({
            message: 'successfully update status'
        })

        // Finalizar pregunta


    } catch (error) {
        next({
            error
        });
    }
}


function formatStudentValues(array_students, id_class, id_question) {
    let values1 = []; //[id_user1, id_user2, id_user3]
    let values2 = []; //[id_class, id_class, id_class]
    let values3 = []; //[id_question, id_question, id_question]
    let values4 = []; //[status1, status2, status3]

    array_students.map((student) => {
        values1.push(student.id_user);
        values2.push(id_class);
        values3.push(id_question);

        // Formatea los estados
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