'use strict'

// Load global config
require('./app/config/config');
// Load modules
const eValidator = require('express-validator')
const express = require('express');
const http = require('http');
const socket = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const colors = require('colors');
const _routes = require('./app/routes/v1');
const _error = require('./app/middlewares/error');
const pool = require('./app/database');
const participantsx = require('./app/sockets').participantsx; //>
//require('./app/sockets')(io, db); // Modulariza la lógica de los sockets

let connected_users = []; // { id_socket, ip } //> usar un object?
let loggedin_users = []; // {id_user, id_socket, role} //> usar un object?
let participants_of_a_question = {}; // { id_class : [...], id_class2: [...], id_class3: [...] }
let students_in_classrooms = {}; // { id_class1 : [...], id_class2: [...], id_class3: [...] }
let refresh_tokens = {}; // { refresh_token1: id_client1, refresh_token2: id_client2 }
let io;

initWebServer();

// Init Web Server
function initWebServer() {

    const app = express(); // Crea una instancia de express
    const httpServer = http.Server(app); // Crea el server con http y express como handle request
    io = socket(httpServer); // Inicia el server de socket.io
    

    // Definimos los middlewares que modifican la request
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(bodyParser.json());
    app.use(cors({
        origin: '*'
    }));
    app.use(eValidator());
    app.use(_routes);
    app.use(_error.logErrors);
    app.use(_error.handler);

    let num_connections = 0;

    (async () => {
        try {

            // Inicia el servidor
            let server = await httpServer.listen(process.env.PORT);

            const address = server.address();
            const host = address.address;
            const port = address.port;

            console.log(` ${colors.green.bold('[SUCCESS]')} webserver is running on ${host}${port}`);

            io.on('connection', (socket) => { // id, 
                num_connections++;

                //const connected_exist = connected_users.find(connected => connected.id_c)
                connected_users.push({
                    id_socket: socket.id,
                    ip: socket.handshake.address
                });

                console.log(`${colors.yellow.bold('[CONN]'.padStart(10))} user ip ${socket.handshake.address} has connected.`);
                console.log(`${colors.blue.bold('[INFO]'.padStart(10))} connected users: ${num_connections}`);
                console.table(connected_users);

                // Logueo de usuarios
                socket.on('loggedInUser', async (data) => { // id_user, role

                    console.log(`${colors.cyan.bold('[SOCKET]'.padStart(10))} on(loggedInUser):`);
                    console.table(data);

                    const { id_user, role } = data;
                    socket.id_user = id_user; // Permite usar el 'id_user' en los otros 'socket'

                    // Comprueba si ya existe una sesión con ese id_socket
                    const session_exist = loggedin_users.find(user => user.id_socket == socket.id);

                    if (!session_exist) {
                        // Si la sesión no existe es agregada al listado de logueados (id_socket, id_user, role)
                        addToLoggedInUsers(data, socket.id);
                    } else {
                        // Si la sesión existe (id_socket), verifica si la sesión esta duplicada (id_user, role)
                        const session_duplicated = loggedin_users.find(user => (user.id_user == id_user && user.role == role));

                        if (!session_duplicated) {
                            // Si la sesión es distinta, se actualiza.
                            console.log(` + user exist.\n + update user session data (id_user, role).\n`)
                            session_exist.id_user = id_user;
                            session_exist.role = role;
                        }
                    }

                    // Si el rol del usuario es estudiante
                    // + Obtiene los cursos en los que esta inscrito el estudiante
                    if (data.role == 3) {
                        const courses = await getStudentCourses(data.id_user);
                        // ... igual que en on.update()
                    }

                    //socket.emit('usersConnectedHasChanged', getusersConnected());
                    // Obtiene los cursos 
                    /*if (data.role == 2) {
                        console.log("usuario role profesor...");
                        addUserToUsersConnected('courses..')

                    }
                    else if (data.role == 3) {
                        console.log("usuario role estudiante...");
                        // { id_course, name_course, }
                        const text = `SELECT c.id_course, c.name, ca.year, ca.semester
                        FROM courses AS c 
                        INNER JOIN calendars as ca 
                        ON ca.id_calendar = c.id_calendar 
                        WHERE id_user = $1`;
                        const values = [data.id_user];
                        const res = (await pool.query(text, values)).rows[0];
                    }*/
                });

                // data: { id_user, }
                /*socket.on('studentEnrolled', (data)=> {
                    console.log("studentEnrolled: ", data);
                });*/


                // El usuario cambia de rol
                socket.on('updateRoleToLoggedInUser', async (data) => { // { id_user, role}

                    const { id_user, role } = data;

                    console.log(`${colors.cyan.bold('[SOCKET]'.padStart(10))} on(updateRoleToLoggedInUser):`);
                    console.table(data);

                    // Ve si ya existe el usuario (id_socket)
                    const user = loggedin_users.find(user => user.id_socket == socket.id);
                    if (user) {
                        // Si existe actualiza su role
                        user.role = role;
                    } else {
                        console.log(" + user (by id_socket) doesn't exist. Add user.");
                        // Aqui la cago porque agrego un usuario sin id_user y porque este evento se ejecuta primero que el connected_user
                        addToLoggedInUsers(data, socket.id);
                    }

                    console.log(`${colors.blue.bold('[INFO]'.padStart(10))} loggedin users:`);
                    console.table(loggedin_users)

                    //socket.emit('usersConnectedHasChanged', getusersConnected());

                    // Si el role del usuario es estudiante
                    // + Obtiene los cursos en los que esta inscrito
                    if (data.role == 3) {
                        const courses = await getStudentCourses(id_user);

                        console.log(" + obtiene cursos del usuario estudiante: ", courses);

                        // Une al usuario a las salas de cada curso en el que esta inscrito
                        courses.forEach(course => {
                            //console.log("COURSE: ", course.id_course)
                            socket.join(course.id_course + 'students');
                        });
                        console.log(" + une al estudiante a las salas: ", socket.rooms, '\n');
                        //console.log(socket.rooms);
                    }

                });


                socket.on('initClass', (data) => {

                });


                // Entrar a la sección de estudiantes de un curso (siendo profesor)
                socket.on('enterToCourseRoom', (params) => {
                    console.log("ID COURSE FOR ROOM: ");
                    console.log(params);
                    socket.join(params.id_course);
                });

                // Salir de la sección de estudiantes de un curso (siendo profesor)
                socket.on('exitToCourseRoom', (params) => {
                    console.log("ID COURSE FOR ROOM (EXIT): ");
                    console.log(params);
                    socket.leave(params.id_course);
                });

                // Entrar a la sección clase (siendo estudiante)
                socket.on('enterToClassSectionRoomAsStudent', (params) => {

                    socket.join(params.id_course + 'class-section-room');

                    console.log(`${colors.cyan.bold('[SOCKET]'.padStart(10))} on(enterToClassSectionRoomAsStudent).`);
                    console.log(`${colors.blue.bold('[INFO]'.padStart(10))} users (students) in the room '${params.id_course}class-section-room':`);

                    // Obtiene los usuarios (estudiantes) de la sala de clase de un curso
                    io.in(params.id_course + 'class-section-room').clients((error, clients) => {
                        if (error) throw error;
                        console.table(clients);
                    });

                });


                socket.on('exitToClassSectionRoomAsStudent', (params) => {
                    console.log("exitToClassSectionRoomAsStudent: ");
                    console.log(params);
                    socket.leave(params.id_course + 'class-section-room');
                });

                // Entrar a la sección de estudiantes de un curso (siendo profesor)
                socket.on('enterToActivitySectionRoomAsStudent', (params) => {
                    socket.join(params.id_course + 'activity-section-room');

                });
                socket.on('exitToActivitySectionRoomAsStudent', (params) => {
                    socket.leave(params.id_course + 'activity-section-room');
                });



                // Listener: indica que un profesor ingresó a una sala
                // + Revisar el estado de la pregunta y en base a eso enviar la data adecuada
                socket.on('enterToPlayQuestionSectionRoomAsTeacher', async (params) => { // { id_class } 

                    const {
                        id_class
                    } = params;

                    socket.join(id_class + 'teacher__play_question_section'); // Se une a la 'room' de profesores en la sala

                    // Emite a si mismo el listado de estudiantes que estan participando por responder (lo hace solo la vez que entra a la sala)
                    // +! Podría recuperar desde el mismo cliente la variable 'students_in_classrooms' con los estados de los estudiantes
                    socket.emit('aStudentHasEntered', {
                        type: 1,
                        detail: 'UPDATE_STUDENT_PARTICIPANTS',
                        participants: participants_of_a_question[id_class] || [],
                    });

                    console.log(`${colors.cyan.bold('[SOCKET]'.padStart(10))} on(enterToPlayQuestionSectionRoomAsTeacher).`);
                    console.log(`${colors.blue.bold('[INFO]'.padStart(10))} users (teachers) in the room '${id_class}teacher__play_question_section':`);

                    // Obtiene los usuarios (profesores) de la 'room' de profesores de la clase
                    io.in(id_class + 'teacher__play_question_section').clients((error, clients) => {
                        if (error) throw error;
                        console.table(clients);
                    });

                });


                // Listener: sale de la sección de juego de la pregunta (como profesor)
                socket.on('exitToPlayQuestionSectionRoomAsTeacher', (params) => {

                    const {
                        id_class
                    } = params;

                    socket.leave(id_class + 'teacher__play_question_section'); // Sale de la 'room' de profesores de la clase

                    console.log(`${colors.cyan.bold('[SOCKET]'.padStart(10))} on(exitToPlayQuestionSectionRoomAsTeacher).`);
                    console.log(`${colors.blue.bold('[INFO]'.padStart(10))} users in the room '${id_class}teacher__play_question_section':`);

                    // Muestra los usuarios (profesores) de la sala de profesores de la clase
                    io.in(id_class + 'teacher__play_question_section').clients((error, clients) => {
                        if (error) throw error;
                        console.table(clients);
                    });
                    // Emite a otros estudiantes que salio de la sala...
                });


                // Entra al conjunto de participantes por responder preguntas de la clase (siendo estudiante)
                socket.on('enterToParticipantsToPlayQuestionSectionRoomAsStudent', async (params) => { // { id_class, user: { } }

                    const {
                        id_class,
                        user
                    } = params;

                    // Se une a la 'room' de estudiantes que estan participando
                    socket.join(id_class + 'student__participant_to_play_question_section');

                    // Crear el array 'student_participants' si no existe
                    if (!participants_of_a_question[id_class]) {
                        console.log("el arrray de participantes no existe asi que lo creo..")
                        participants_of_a_question[id_class] = [];
                    }
                    // Agregar el id_socket y el participation_status al objeto user
                    user.id_socket = socket.id;
                    user.status = 2;

                    console.log("usuario a insertar en el array: ", user);
                    // Hacer push al array de participantes de la clase.
                    let index_participant_exist = participants_of_a_question[id_class].findIndex(student => student.id_user == user.id_user);

                    if (index_participant_exist < 0) participants_of_a_question[id_class].push(user); // Inserta al estudiante en el listado de participantes


                    console.log("array de participantes: ", participants_of_a_question[id_class])

                    // Cambia el estado del estudiante en 'students_in_classrooms' a 'no seleccionado'.
                    let index_student = students_in_classrooms[id_class].findIndex(student => student.id_user == user.id_user);
                    if (index_student >= 0) {
                        students_in_classrooms[id_class][index_student].participation_status = 2;
                    }

                    // Emiter: a los profesores que un estudiante decidió participar
                    socket.to(id_class + 'teacher__play_question_section')
                        .emit('aStudentHasEntered', {
                            type: 2,
                            detail: 'NEW_STUDENT_PARTICIPANT',
                            student: user
                        });

                    // Indica a todos los estudiantes en la sala de clases que este estudiante decidió participar
                    console.log(" + emite evento a todos los students: ", id_class + 'play_question_section');

                    //(params.id_class + 'play-question-section');

                    // Emiter: a los estudiantes de la sala (se incluye) que un estudiante desea participar por responder
                    io.sockets.in(id_class + 'play-question-section')
                        .emit('studentHasEnteredToTheClassroom', {
                            type: 2,
                            id_user: user.id_user,
                            update_student_status: 2, // status 'no seleccionado'
                            update_question_status: 2 // status 'pregunta iniciada' // útil cuando se cambia estado de seleccionado a no seleccionado
                        });
                });


                // Listener: indica que un estudiante canceló su participación por responder
                socket.on('exitToParticipantsToPlayQuestionSectionRoomAsStudent', async (params) => { // {id_class, id_user}

                    const {
                        id_class,
                        id_user
                    } = params;

                    socket.leave(id_class + 'student__participant_to_play_question_section');
                    console.log("exitToParticipantsToPlayQuestionSectionRoomAsStudent: ", id_class + 'student__participant_to_play_question_section');

                    console.log("participants: ", participants_of_a_question[id_class]);

                    // Quitar al estudiante de la lista de participantes (si es que esta)
                    // + Arreglar esto en el cliente. No debería emitir este evento si nunca participo.
                    if (participants_of_a_question[id_class]) {
                        let index_student_participant = participants_of_a_question[id_class].findIndex(student => student.id_user == id_user);
                        if (index_student_participant >= 0) participants_of_a_question[id_class].splice(index_student_participant, 1);

                        // Emiter: a los profesores que un canceló su participación
                        socket.to(id_class + 'teacher__play_question_section').emit('aStudentHasEntered', {
                            type: 4,
                            detail: 'CANCEL_STUDENT_PARTICIPATION',
                            id_user
                        });
                    }

                    // Cambia el estado del estudiante a 'en espera'
                    let index_student = students_in_classrooms[id_class].findIndex(student => student.id_user == id_user);
                    if (index_student >= 0) {
                        students_in_classrooms[id_class][index_student].participation_status = 1;
                    }

                    // Emiter: indica a los estudiantes de la sala (se incluye) que un estudiante canceló su participación
                    io.sockets.in(id_class + 'play-question-section')
                        .emit('studentHasEnteredToTheClassroom', {
                            type: 2,
                            id_user: id_user,
                            update_student_status: 1, // status 'en espera'
                            update_question_status: 2 // status 'pregunta iniciada'
                        });

                });


                // Estudiante ingresa a la sala de clase para responder preguntas
                // + { id_class , user: { id_user, username, name, last_name, middle_name, profile_image } }
                socket.on('enterToPlayQuestionSectionRoomAsStudent', async (params) => {

                    const {
                        id_class,
                        user
                    } = params;

                    socket.join(id_class + 'play-question-section'); // Une al estudiante a la 'room' de estudiantes dentro de la clase

                    // Obtiene la pregunta activa en la clase (si es que hay) (status 2: iniciada, 3: detenida y 4: respondiendo)
                    const text2 = `
                        SELECT cq.id_question, cq.status, q.description, q.difficulty, q.image 
                        FROM class_question AS cq
                        INNER JOIN questions AS q
                        ON cq.id_question = q.id_question
                        WHERE cq.id_class = $1
                        AND (cq.status = 2 OR cq.status = 3 OR cq.status = 4)`;
                    const values2 = [id_class];
                    const question = (await pool.query(text2, values2)).rows[0];

                    // Emite al mismo estudiante la pregunta activa (si es que hay)
                    if (question) socket.emit('studentHasEnteredToTheClassroom', {
                        type: 3,
                        detail: 'UPDATE_QUESTION_STATUS',
                        question: question
                    });

                    let participation_status = 1; // Establece el estado del estudiante en 'en espera'

                    if (participants_of_a_question[id_class]) { // Se mantiene estado perderdor
                        console.log("participants_of_a_question[id_class]: ", participants_of_a_question[id_class]);
                        // Busca al estudiante en el listado de participantes
                        const student = participants_of_a_question[id_class].find(participant => participant.id_user == user.id_user);
                        // Actualiza el estado del estudiante (si lo encuentra)
                        if (student) participation_status = student.status;
                    }

                    // Crea el array de estudiantes en la clase (si no existe)  
                    if (!students_in_classrooms[id_class]) students_in_classrooms[id_class] = [];

                    console.log("students_in_classrooms[id_class]: ", students_in_classrooms[id_class]);
                    // Busca al estudiante en el listado de estudiantes en la sala
                    const student = students_in_classrooms[id_class].find(student => student.id_user == user.id_user);
                    if (!student) {
                        //user.id_socket = socket.id; // Añade el 'id_socket' al objeto usuario ¿Para que?
                        user.participation_status = participation_status; // Añade el 'participation_status'
                        students_in_classrooms[id_class].push(user); // Añade el estudiante a la lista de estudiante en la sala
                    }

                    // Emiter: indica a los estudiantes de la sala (se incluye) el nuevo listado de estudiantes y sus estados
                    io.sockets.in(id_class + 'play-question-section')
                        .emit('studentHasEnteredToTheClassroom',
                            students_in_classrooms[id_class]
                        );

                    // Emite a los profesores que un estudiante ingreso a la sala.
                    /*socket.to(params.id_class + 'student__participant_to_play_question_section').emit('aStudentHasEntered', {
                        // Necesito los datos del estudiante..
                        student: params.user
                    });*/
                });

                socket.on('updateParticipantStatus', async (params) => { // { id_user, id_class, id_question, status }
                    const {
                        id_user,
                        id_class,
                        id_question,
                        status
                    } = params;

                    if (participants_of_a_question[id_class]) {
                        // Busca al estudiante entre los participantes
                        let index_participant = participants_of_a_question[id_class].findIndex(participant => participant.id_user == id_user);
                        // Actualiza el estado del participante (si lo encuentra)
                        if (index_participant >= 0) participants_of_a_question[id_class][index_participant].status = status;
                    }

                    if (students_in_classrooms[id_class]) {
                        // Busca al estudiante entre los estudiantes en la sala
                        let index_student = students_in_classrooms[id_class].findIndex(student => student.id_user == id_user);
                        // Actualiza el estado del estudiante (si lo encuentra)
                        if (index_student >= 0) students_in_classrooms[id_class][index_student].participation_status = status;
                    }

                    let new_question_status;
                    switch(status){
                        case 2:
                            new_question_status = 3;
                            break;
                        case 3:
                            new_question_status = 4;
                            break;
                        default:
                            new_question_status = 1;
                            break;
                    }

                    // Actualiza el estado de la pregunta de clase
                    const text = `
                        UPDATE class_question 
                        SET status = $1 
                        WHERE id_class = $2 
                        AND id_question = $3`;
                    const values = [new_question_status, id_class, id_question];
                    await pool.query(text, values);

                    // Emite a estudiantes de la sala que un participante cambio de estado

                });

                //>
                // Listener: profesor selecciona estudiante para responder
                socket.on('selectStudentToParticipate', async (params) => { // { id_user, id_class, id_question }

                    const {
                        id_user,
                        id_class,
                        id_question
                    } = params;

                    // Busca al estudiante 'seleccionado' entre los participantes
                    let index_participant = participants_of_a_question[id_class].findIndex(participant => participant.id_user == id_user);
                    // Actualiza el estado del estudiante a 'seleccionado' (si es que lo encuentra)
                    if (index_participant >= 0) {
                        participants_of_a_question[id_class][index_participant].status = 3;
                    }

                    // Busca al estudiante seleccionado entre los que están conectados a la clase
                    let index_student = students_in_classrooms[id_class].findIndex(student => student.id_user == id_user);
                    // Actualiza el estado del estudiante a 'seleccionado' (si es que lo encuentra)
                    if (index_student >= 0) students_in_classrooms[id_class][index_student].participation_status = 3;

                    // Actualiza el estado de la pregunta de clase
                    const text = `
                        UPDATE class_question 
                        SET status = 4 
                        WHERE id_class = $1 
                        AND id_question = $2 `;
                    const values = [id_class, id_question];
                    await pool.query(text, values);

                    //> AQUI CAMBIA!

                    // Emite a estudiantes de la sala que uno fue seleccionado
                    socket.to(id_class + 'play-question-section')
                        .emit('studentSelectedToParticipate', {
                            id_user: id_user
                        });

                });


                //>
                // Listener: profesor cancela la selección de un estudiante
                socket.on('cancelSelectedStudentAsTeacher', async (params) => { // id_user, id_class, id_question

                    const {
                        id_user,
                        id_class,
                        id_question
                    } = params;

                    if (participants_of_a_question[id_class]) {
                        // Busca al estudiante 'cancelado' entre los participantes
                        let index_participant = participants_of_a_question[id_class].findIndex(participant => participant.id_user == id_user);
                        // Actualiza el estado del estudiante a 'cancelado' (si es que lo encuentra)
                        if (index_participant >= 0) {
                            participants_of_a_question[id_class][index_participant].status = 2;
                        }
                    }

                    if (students_in_classrooms[id_class]) {
                        // Busca al estudiante 'seleccionado' entre los estudiantes en la sala
                        let index_student = students_in_classrooms[id_class].findIndex(student => student.id_user == id_user);
                        // Actualiza el estado del estudiante a 'no seleccionado' (si es que lo encuentra)
                        if (index_student >= 0) students_in_classrooms[id_class][index_student].participation_status = 2;
                    }

                    // Actualiza el estado de la pregunta de clase
                    const text = `
                        UPDATE class_question 
                        SET status = 3 
                        WHERE id_class = $1 
                        AND id_question = $2 `;
                    const values = [id_class, id_question];
                    await pool.query(text, values);

                    //> AQUI CAMBIA

                    // Emiter: indica a las sesiones del profesor que este canceló la selección de un estudiante
                    // + Falso: Solo emite a la misma sesión del profesor y no a todas sus sesiones.
                    socket.emit('aStudentHasEntered', {
                        type: 3,
                        detail: 'CANCEL_STUDENT_SELECTED',
                        id_user: id_user,
                        question_status: 3 // Estado de pregunta 'detenida'
                    });

                    // Emite a estudiantes de la sala que uno fue seleccionado
                    /*
                    socket.to(id_class + 'play-question-section')
                        .emit('studentSelectedToParticipate', {
                            id_user: id_user
                        });
                    */

                    io.sockets.in(id_class + 'play-question-section')
                        .emit('studentHasEnteredToTheClassroom', {
                            type: 2,
                            detail: 'UPDATE_STUDENT_STATUS',
                            id_user: id_user,
                            update_student_status: 2, // Estado de estudiante 'no seleccionado'
                            update_question_status: 3 // Estado de pregunta 'detenida'
                        });
                });


                // Estudiante sale de la sección de juego de la pregunta
                socket.on('exitToPlayQuestionSectionRoomAsStudent', (params) => { // { id_class, id_user }

                    const {
                        id_class,
                        id_user
                    } = params;

                    socket.leave(id_class + 'play-question-section'); // Deja la sala de juego de la clase

                    if (students_in_classrooms[id_class]) {

                        // Busca al estudiante que salió de la sala entre los asistentes
                        let index_student = students_in_classrooms[id_class].findIndex(student => student.id_user == id_user);
                        // Elimina al estudiante de entre los asistentes (si lo encuentra)
                        if (index_student >= 0) students_in_classrooms[id_class].splice(index_student, 1);

                        // Emiter: indica a otros estudiantes que un estudiante salío de la sala
                        socket.to(id_class + 'play-question-section')
                            .emit('studentHasEnteredToTheClassroom', {
                                type: 5,
                                detail: 'STUDENT_LEFT_CLASS',
                                id_user: id_user
                            });
                    }
                });


                socket.on('loggedOutUser', () => {
                    deleteFromLoggedInUsers(socket.id);
                    socket.leaveAll(); // Desconecta el socket de todas las salas
                    delete socket.id_user;

                    console.log(`${colors.blue.bold('[INFO]'.padStart(10))} loggedin users (after loggedOutUser):`);
                    console.table(loggedin_users);
                });


                //this.socket.disconnect(socket); // Función modularizada para escuchar desconnect
                socket.on('disconnect', () => {
                    num_connections--;
                    deleteFromConnectedUsers(socket.id);
                    deleteFromLoggedInUsers(socket.id);
                    console.log(`${colors.yellow.bold('[DISCONN]'.padStart(10))} user ip ${socket.handshake.address} has disconnected.`);
                    console.log(`${colors.blue.bold('[INFO]'.padStart(10))} connected users: ${num_connections}`);
                    //socket.emit('usersConnectedHasChanged', getusersConnected());
                });

            })
        } catch (error) {
            console.log(error);
            process.exit(0); // Si ocurre un error matamos el proceso
        }

    })();
}





function getLoggedInUserByIdUser(id_user) {
    return loggedin_users.find(user => user.id_user == id_user);
}


function getusersConnectedByRoom(room) {
    return loggedin_users.filter(user => user.room == room);
}

function addToLoggedInUsers(user, id_socket) {
    loggedin_users.push({
        'id_user': user.id_user,
        'role': user.role,
        'id_socket': id_socket,
    });
}

const deleteFromLoggedInUsers = (id_socket) => {
    const index_user = loggedin_users.findIndex(user => user.id_socket == id_socket);
    if (index_user >= 0) loggedin_users.splice(index_user, 1);
}

// Como mantener un máximo de 3 conectados en local...
function addToConnectedUsers(id_socket, ip) {
    loggedin_users.push({
        id_socket,
        ip
    });
}

const deleteFromConnectedUsers = (id_socket) => {
    const index_user = connected_users.findIndex(user => user.id_socket == id_socket);
    if (index_user >= 0) connected_users.splice(index_user, 1);
}

async function getStudentCourses(id_user) {
    const text = `
    SELECT id_course
    FROM course_user AS cu
    WHERE id_user = $1
    AND active = TRUE`;
    const values = [id_user];
    const courses = (await pool.query(text, values)).rows;
    return courses;
}

// Actualiza los datos de un usuario conectado
// + Puede actualizar {username, role, id_socket, courses}
function updateUserConnected(id_socket, role) {
    user.role = role
    //user.socket_id.push(id_socket);
    //user.courses = data_courses;
    console.log("UPDATE CONNECTED: ", loggedin_users);
}



function getCourses(id_user, user_role) {
    if (user_role == 1) {
        console.log("ADMIN ROLE...");
    }
    if (user_role == 2) {
        console.log("TEACHER ROLE...");
    } else if (user_role == 3) {
        console.log("STUDENT ROLE...");
    }

}


// Export Methods
module.exports.getSocket = () => {
    return io;
}

module.exports.getusersConnected = () => {
    return loggedin_users;
}

module.exports.getStudentParticipants = (id_class) => {
    return participants_of_a_question[id_class];
}

module.exports.setParticipants = (id_class, value) => {
    return participants_of_a_question[id_class] = value;
}

module.exports.getStudentsInClassroom = (id_class) => {
    return students_in_classrooms[id_class];
}

module.exports.getRefreshTokens = () => {
    return refresh_tokens;
}

// Porque no [id_user] = refresh_tokens;
module.exports.addRefreshToken = (refresh_token, id_user) => {
    refresh_tokens[refresh_token] = id_user;
}

module.exports.deleteRefreshToken = (refresh_token) => {
    if (refresh_token in refresh_tokens) {
        delete refresh_tokens[refresh_token];
    }
}

module.exports.resetStudentsInClassroomStatus = (id_class) => {

    const students = students_in_classrooms[id_class];

    if (students && students.length > 0) {
        students.forEach(student => {
            student.participation_status = 1;
        });
    }
}


/*
module.exports = {
    getSocket: () => io,
    getusersConnected,
};*/

//module.exports.getSocket = getSocket;