'use strict'

// Load global config
require('./app/config/config');
// Load modules
const eValidator = require('express-validator'),
    createError = require('http-errors'),
    express = require('express'),
    http = require('http'),
    socket = require('socket.io'),
    cors = require('cors'),
    colors = require('colors');
const _routes = require('./app/routes/v1');
const _error = require('./app/middlewares/error');
const pool = require('./app/database');

let setParticipants = (id_class, value) => {
    return participants_of_a_question[id_class] = value;
}

let resetStudentsInClassroomStatus = (id_class) => {
    const students = students_in_classrooms[id_class];
    if (students && students.length > 0) {
        students.forEach(student => student.participation_status = 1);
    }
}

const participantsx = require('./app/sockets').participantsx; //>
//require('./app/sockets')(io, db); // Modulariza la lógica de los sockets

let connected_users = []; // { id_socket, ip } //> usar un object?
let loggedin_users = []; // {id_user, id_socket, role} //> usar un object?
let participants_of_a_question = {}; // { id_class : [...], id_class2: [...], id_class3: [...] }
let students_in_classrooms = {}; // { id_class1 : [...], id_class2: [...], id_class3: [...] }
let refresh_tokens = {}; // { refresh_token1: id_client1, refresh_token2: id_client2 }
let io;

//>
initWebServer();


// Init Web Server
//>
function initWebServer() {

    const app = express(); // Crea una instancia de express
    const httpServer = http.Server(app); // Crea el server con http y express como handle request
    io = socket(httpServer);


    // Middlewares
    app
        //.use(logger('dev'))
        .use(express.json())
        .use(express.urlencoded({
            extended: false
        }))
        .use(cors({
            origin: '*'
        }))
        .use(eValidator())
        .use(_routes)
        .use(_error.logErrors)
        .use(_error.handler);

    let num_connections = 0;

    (async () => {
        try {

            // Inicia el servidor
            const server = await httpServer.listen(process.env.PORT);
            // Obtiene información del servidor
            const _address = server.address();
            const {
                address,
                port
            } = _address;
            console.log(` ${colors.green.bold('[SUCCESS]')} webserver is running on ${address}${port}`);

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

                // Usuario inicia sesión
                socket.on('loggedInUser', async (data) => { // { id_user, role }

                    console.log(`${colors.cyan.bold('[SOCKET]'.padStart(10))} on(loggedInUser):`);
                    console.table(data);

                    const {
                        id_user,
                        role
                    } = data;
                    socket.id_user = id_user; //> Permite usar el 'id_user' en los otros 'socket'

                    // Verifica si existe una sesión con el actual 'id_socket'
                    const session = loggedin_users.find(user => user.id_socket == socket.id);
                    // Loguea al usuario (si la sesión no existe)
                    if (!session) addToLoggedInUsers(data, socket.id);
                    else {
                        // Actualiza la sesión (si ya existe)
                        session.id_user = id_user;
                        session.role = role;
                    }

                    // Si el rol del usuario es estudiante
                    //> ARREGLAR LO DE ABAJO
                    // + Obtiene los cursos en los que esta inscrito el estudiante
                    if (role == 3) {
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

                // Actualiza el rol de un usuario logueado
                socket.on('updateRoleToLoggedInUser', async (data) => { // { id_user, role}

                    const {
                        id_user,
                        role
                    } = data;

                    // Verifica si existe una sesión con el actual 'id_socket'
                    const session = loggedin_users.find(user => user.id_socket == socket.id);
                    // Actualiza la sesión (si existe)
                    if (session) session.role = role;
                    else {
                        console.log(" + user (by id_socket) doesn't exist. Add user.");
                        // Aqui la cago porque agrego un usuario sin id_user y porque este evento se ejecuta primero que el connected_user
                        addToLoggedInUsers(data, socket.id);
                    }

                    console.log(`${colors.blue.bold('[INFO]'.padStart(10))} loggedin users:`);
                    console.table(loggedin_users)

                    //socket.emit('usersConnectedHasChanged', getusersConnected());


                    if (role == 3) {
                        // Obtiene los cursos en los que esta inscrito (si es estudiante)
                        const courses = await getStudentCourses(id_user);
                        console.log(" + obtiene cursos del usuario estudiante: ", courses);
                        // Une al estudiante a las salas de cada curso en el que esta inscrito
                        courses.forEach(course => socket.join(course.id_course + 'students'));
                        console.log(" + une al estudiante a las salas: ", socket.rooms, '\n');
                    }

                });

                // Entrar a la sección de estudiantes de un curso (siendo profesor)
                socket.on('enterToCourseRoom', (params) => {
                    console.log("ID COURSE FOR ROOM: ");
                    console.log(params);
                    socket.join(params.id_course);
                });

                // Sale de la sección de estudiantes de un curso (siendo profesor)
                socket.on('exitToCourseRoom', (params) => {
                    console.log("ID COURSE FOR ROOM (EXIT): ");
                    console.log(params);
                    socket.leave(params.id_course);
                });

                // Entrar a la sección clase (siendo estudiante)
                socket.on('enterToClassSectionRoomAsStudent', (params) => {

                    const {
                        id_course
                    } = params;
                    socket.join(id_course + 'class-section-room');

                    console.log(`${colors.cyan.bold('[SOCKET]'.padStart(10))} on(enterToClassSectionRoomAsStudent).`);
                    console.log(`${colors.blue.bold('[INFO]'.padStart(10))} users (students) in the room '${id_course}class-section-room':`);

                    // Obtiene los usuarios (estudiantes) de la sala de clase de un curso
                    io.in(id_course + 'class-section-room').clients((error, clients) => {
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

                    // Se une a la 'room' de profesores en una clase
                    socket.join(id_class + 'teacher__play_question_section');

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

                    // Sale de la 'room' de profesores en una clase
                    socket.leave(id_class + 'teacher__play_question_section');

                    console.log(`${colors.cyan.bold('[SOCKET]'.padStart(10))} on(exitToPlayQuestionSectionRoomAsTeacher).`);
                    console.log(`${colors.blue.bold('[INFO]'.padStart(10))} users in the room '${id_class}teacher__play_question_section':`);

                    // Muestra los usuarios (profesores) de la sala de profesores de la clase
                    io.in(id_class + 'teacher__play_question_section').clients((error, clients) => {
                        if (error) throw error;
                        console.table(clients);
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
                    const text = `
                        SELECT cq.id_question, cq.status, q.description, q.difficulty, q.image 
                        FROM class_question AS cq
                        INNER JOIN questions AS q
                        ON cq.id_question = q.id_question
                        WHERE cq.id_class = $1
                        AND (cq.status = 2 OR cq.status = 3 OR cq.status = 4)`;
                    const values = [id_class];
                    const question = (await pool.query(text, values)).rows[0];

                    // Emite asi mismo la pregunta activa (si es que hay)
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

                socket.on('updateParticipantStatus', async (params) => {

                    const {
                        id_user,
                        id_class,
                        id_question,
                        status,
                        sender
                    } = params;

                    if (students_in_classrooms[id_class]) {
                        // Busca al estudiante entre los estudiantes en la sala
                        const index_student = students_in_classrooms[id_class].findIndex(student => student.id_user == id_user);
                        // Actualiza el estado del estudiante (si lo encuentra)
                        if (index_student >= 0) students_in_classrooms[id_class][index_student].participation_status = status;
                    }

                    // Crea el array 'student_participants' (si no existe)
                    if (!participants_of_a_question[id_class]) participants_of_a_question[id_class] = [];
                    const participants = participants_of_a_question[id_class];
                    // Busca al estudiante entre los participantes
                    const index_participant = participants.findIndex(participant => participant.id_user == id_user);

                    let question_status;
                    if (sender == 'STUDENT') {

                        question_status = 2; // iniciada
                        // + estudiante decide participar (status 2)
                        if (status == 2) {

                            // Obtiene los datos del usuario
                            const text = `
                                SELECT id_user, name, last_name, middle_name, document
                                FROM USERS
                                WHERE id_user = $1`;
                            const values = [id_user];
                            const user = (await pool.query(text, values)).rows[0];

                            // Se une a la 'room' de estudiantes que estan participando
                            socket.join(id_class + 'student__participant_to_play_question_section');
                            // Agrega el 'id_socket' y el 'status' al objeto user
                            user.id_socket = socket.id;
                            user.status = status;
                            // Inserta al estudiante en el listado de participantes (si no existe)
                            if (index_participant < 0) participants.push(user);

                            // Obtiene el 'id_course'
                            const text2 = `
                                SELECT m.id_course
                                FROM modules AS m
                                INNER JOIN classes AS c
                                ON m.id_module = c.id_module
                                WHERE c.id_class = $1`;
                            const values2 = [id_class];
                            const { id_course } = (await pool.query(text2, values2)).rows[0];

                            const client = await pool.pool.connect();
                            let promises = []; // Array para ejecutar consultas en paralelo

                            // Total de preguntas realizadas en una clase
                            const text3 = `
                        SELECT count(*)
                        FROM class_question
                        WHERE id_class = $1
                        AND status = 5`;
                            const values3 = [id_class];
                            promises.push(client.query(text3, values3)); // Agrega la query al array 'promises'

                            // Total de preguntas realizadas en un curso
                            const text4 = `
                        SELECT count(*)
                        FROM class_question AS cq
                        INNER JOIN classes AS c
                        ON cq.id_class = c.id_class
                        INNER JOIN modules AS m
                        ON c.id_module = m.id_module
                        WHERE m.id_course = $1 
                        AND cq.status = 5`;
                            const values4 = [id_course];
                            promises.push(client.query(text4, values4)); // Agrega la query al array 'promises'

            
                            // Total de 'ganadas' de un estudiante en una clase
                            const text5 = `
                        SELECT count(*)
                        FROM user_question_class AS uqc
                        INNER JOIN class_question AS cq
                        ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
                        WHERE uqc.id_class = $1
                        AND uqc.id_user = $2
                        AND uqc.status = 5
                        AND cq.status = 5`;
                            const values5 = [id_class, id_user];
                            promises.push(client.query(text5, values5)); // Agrega la query al array 'promises'

                            // Total de 'perdidas' de un estudiante en una clase
                            const text6 = `
                        SELECT count(*)
                        FROM user_question_class AS uqc
                        INNER JOIN class_question AS cq
                        ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
                        WHERE uqc.id_class = $1
                        AND uqc.id_user = $2
                        AND uqc.status = 4
                        AND cq.status = 5`;
                            const values6 = [id_class, id_user];
                            promises.push(client.query(text6, values6)); // Agrega la query al array 'promises'

                            // Total de 'no seleccionado' de un estudiante en una clase
                            const text7 = `
                        SELECT count(*)
                        FROM user_question_class AS uqc
                        INNER JOIN class_question AS cq
                        ON (uqc.id_class = cq.id_class AND uqc.id_question = cq.id_question)
                        WHERE uqc.id_class = $1
                        AND uqc.id_user = $2
                        AND uqc.status = 2
                        AND cq.status = 5`;
                            const values7 = [id_class, id_user];
                            promises.push(client.query(text7, values7)); // Agrega la query al array 'promises'

                          

                            // Total de 'ganadas' de un estudiante en un curso
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
                        AND uqc.status = 5`;
                            const values8 = [id_course, id_user];
                            promises.push(client.query(text8, values8)); // Agrega la query al array 'promises'

                            // Total de 'perdidas' de un estudiante en un curso
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
                        AND uqc.status = 4`;
                            const values9 = [id_course, id_user];
                            promises.push(client.query(text9, values9)); // Agrega la query al array 'promises'

                            // Total de 'ganadas' de un estudiante en un curso
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
                        AND uqc.status = 5`;
                            const values10 = [id_course, id_user];
                            promises.push(client.query(text10, values10)); // Agrega la query al array 'promises'



                            const result = await Promise.all(promises); // Ejecuta consultas en paralelo
                            console.log("caca: ", result);

                            
                            const class_questions = parseInt(result[0].rows[0].count);
                            const course_questions = parseInt(result[1].rows[0].count);

                            const class_student_winner = parseInt(result[2].rows[0].count);
                            const class_student_losser = parseInt(result[3].rows[0].count);
                            const class_student_not_selected = parseInt(result[4].rows[0].count);

                            const class_student_participations = class_student_winner + class_student_losser + class_student_not_selected;
                            const class_student_no_participations = class_questions - class_student_participations;

                            const course_student_winner = parseInt(result[5].rows[0].count);
                            const course_student_losser = parseInt(result[6].rows[0].count);
                            const course_student_not_selected = parseInt(result[7].rows[0].count);

                            const course_student_participations = course_student_winner + course_student_losser + course_student_not_selected;
                            const course_student_no_participations = course_questions - course_student_participations;

                            
                            user.student_overview = {
                                class_questions,
                                course_questions,
                                class_student_participations,
                                class_student_no_participations,
                                class_student_winner,
                                class_student_losser,
                                class_student_not_selected,
                                course_student_participations,
                                course_student_no_participations,
                                course_student_winner,
                                course_student_losser,
                                course_student_not_selected
                            }

                            //>
                            // Emiter: a profesores que un estudiante decidió participar
                            io.in(id_class + 'teacher__play_question_section')
                                .emit('aStudentHasEntered', {
                                    type: 2,
                                    detail: 'NEW_STUDENT_PARTICIPANT',
                                    student: user
                                });
                        }

                        // + estudiante cancela su participación (status 1)
                        else if (status == 1) {
                            // Elimina al participante
                            participants.splice(index_participant, 1);
                            // Estudiante deja la 'room'
                            socket.leave(id_class + 'student__participant_to_play_question_section');
                            // Emiter: a profesores que un estudiante canceló su participación
                            socket.in(id_class + 'teacher__play_question_section').emit('aStudentHasEntered', {
                                type: 4,
                                detail: 'CANCEL_STUDENT_PARTICIPATION',
                                id_user
                            });

                        }
                    } else if (sender == 'TEACHER') {
                        // + profesor selecciona estudiante (status 3)
                        if (status == 3) question_status = 4; // respondiendo
                        // + profesor cancela la selección de estudiante (status 2)
                        else if (status == 2) question_status = 3; // detenida
                        // + profesor establece estudiante perdedor (status 4)
                        else if (status == 4) question_status = 3; // detenida
                        // + profesor establece estudiante ganador (status 5)
                        else if (status == 5) question_status = 5; // finalizada

                        // Actualiza el estado de la pregunta de clase
                        const text = `
                            UPDATE class_question 
                            SET status = $1 
                            WHERE id_class = $2 
                            AND id_question = $3`;
                        const values = [question_status, id_class, id_question];
                        await pool.query(text, values);

                        // Obtiene datos adicionales de la pregunta
                        const text2 = `
                            SELECT id_question, difficulty, description, image 
                            FROM questions
                            WHERE id_question = $1`;
                        const values2 = [id_question];
                        const question = (await pool.query(text2, values2)).rows[0];
                        question.status = status; // Establece el estado actual de la pregunta

                        // Actualiza el estado del participante (si lo encuentra)
                        if (index_participant >= 0) participants[index_participant].status = status;

                        if (status == 5) {
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

                            const participants_overview = {
                                no_selected, losers, winner_name, total
                            };

                            // Elimina participantes de la variable 'participants_of_a_question'
                            setParticipants(id_class, []);
                            // Actualiza el estado de los estudiantes en clase 'students_in_classrooms' a 'en espera' (status 1) 
                            resetStudentsInClassroomStatus(id_class);

                            console.log("go ctmsa");
                            // Emite la pregunta a los estudiantes que esten en la sección de juego de la clase
                            socket.in(id_class + 'play-question-section').emit('studentHasEnteredToTheClassroom', {
                                type: 3,
                                detail: 'UPDATE_QUESTION_STATUS',
                                question: question,
                                participants_overview: participants_overview || {}
                            });
                        }

                    }

                    // Emiter: indica a las sesiones del profesor el cambio de estado del participante
                    //>

                    // Emiter: a estudiantes de la sala que un participante cambio de estado
                    io.in(id_class + 'play-question-section')
                        .emit('studentHasEnteredToTheClassroom', { //> Solo por ahora, cambiar ese nombre feo
                            type: 'UPDATE_STUDENT_STATUS',
                            id_user: id_user,
                            id_question: id_question,
                            student_status: status,
                            question_status: question_status
                        });

                    // Actualiza el estado de la pregunta
                    //>socket.write("POST /lesson_questions/13/35 HTTP/1.1\r\n\r\n");

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

                        // Emiter: a otros estudiantes que un estudiante salío de la sala
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
                    socket.leaveAll(); // Lo desconecta de todas las 'rooms'
                    delete socket.id_user; //>

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
            process.exit(0); // Mata el proceso
        }

    })();
}





const findLoggedInUser = (id_user) => {
    return loggedin_users.find(user => user.id_user == id_user);
}


function getusersConnectedByRoom(room) {
    return loggedin_users.filter(user => user.room == room);
}

const addToLoggedInUsers = (user, id_socket) => {
    loggedin_users.push({
        id_user: user.id_user,
        role: user.role,
        id_socket: id_socket,
    });
}

const deleteFromLoggedInUsers = (id_socket) => {
    const index_user = loggedin_users.findIndex(user => user.id_socket == id_socket);
    if (index_user >= 0) loggedin_users.splice(index_user, 1);
}

const deleteFromConnectedUsers = (id_socket) => {
    const index_user = connected_users.findIndex(user => user.id_socket == id_socket);
    if (index_user >= 0) connected_users.splice(index_user, 1);
}

// Como mantener un máximo de 3 conectados en local...
function addToConnectedUsers(id_socket, ip) {
    loggedin_users.push({
        id_socket,
        ip
    });
}


// Obtiene los cursos en los que esta inscrito un estudiante
const getStudentCourses = async (id_user) => {
    const text = `
        SELECT id_course
        FROM course_user AS cu
        WHERE id_user = $1
        AND active = TRUE`;
    const values = [id_user];
    const {
        rows
    } = (await pool.query(text, values));
    return rows;
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
    return participants_of_a_question[id_class] || [];
}

module.exports.setParticipants = (id_class, value) => {
    return participants_of_a_question[id_class] = value;
}

setParticipants = (id_class, value) => {
    return participants_of_a_question[id_class] = value;
}

module.exports.getStudentsInClassroom = (id_class) => {
    return students_in_classrooms[id_class] || [];
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
        students.forEach(student => student.participation_status = 1);
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

/*
module.exports = {
    getSocket: () => io,
    getusersConnected,
};*/

//module.exports.getSocket = getSocket;