'use strict'

// Load modules
const pool = require('../database');
const socket = require('../../index');

// Get classes
const getLessons = async (req, res, next) => {
    
    try {

        const id_course = req.query.id_course || null;
        const id_module = req.query.id_module || null;
        const status = req.query.status || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula 'from' a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        // Obtiene las clases
        const text = `
            SELECT m.name AS module, c.id_class, c.id_module, c.description, c.status, c.date, c.created_at, c.updated_at 
            FROM modules AS m 
            INNER JOIN classes AS c 
            ON m.id_module = c.id_module 
            WHERE ($1::int IS NULL OR m.id_course = $1) 
            AND ($2::int IS NULL OR m.id_module = $2) 
            AND ($3::int IS NULL OR c.status = $3) 
            LIMIT $4 
            OFFSET $5`;
        const values = [id_course, id_module, status, page_size, from];
        const {
            rows
        } = await pool.query(text, values);

        // Obtiene la cantidad total de clases (de acuerdo a los parámetros de filtro)
        const text2 = `
            SELECT count(*) 
            FROM classes 
            WHERE ($1::int IS NULL OR id_module = $1) 
            AND ($2::int IS NULL OR id_module IN (
                SELECT id_module 
                FROM modules 
                WHERE id_course = $2)
                ) 
            AND ($3::int IS NULL OR status = $3)`;
        const values2 = [id_module, id_course, status];
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

const getClassById = async (req, res, next) => {

    try {

        const { id_class } = req.params;

        // Obtiene las clases
        const text = `
            SELECT c.id_class, c.id_module, c.description, c.date, c.created_at, c.updated_at, c.status, m.name AS module, co.name AS course, s.name AS subject
            FROM classes AS c
            INNER JOIN modules AS m
            ON c.id_module = m.id_module
            INNER JOIN courses AS co
            ON m.id_course = co.id_course
            INNER JOIN subjects AS s
            ON co.id_subject = s.id_subject
            WHERE c.id_class = $1`;
        const values = [id_class];
        const {
            rows
        } = await pool.query(text, values);

        res.send(rows[0]);
    } catch (error) {
        next({
            error
        });
    }
}

// Get classes as select options
const getLessonOptions = async (req, res, next) => {

    try {

        const {
            id_module
        } = req.query; // Obligatorio por ahora    

        // Consulta que obtiene las clases
        const text = `
            SELECT id_class, description 
            FROM classes 
            WHERE id_module = $1`;
        const values = [id_module];
        const {
            rows
        } = await pool.query(text, values);

        res.json(rows);
    } catch (error) {
        next({
            error
        });
    }
}

// Create class
const createLesson = async (req, res, next) => {

    try {
        
        const {
            id_module,
            description,
            date
        } = req.body;

        const text = `
            INSERT INTO classes(id_module, description, date) 
            VALUES($1, $2, $3) 
            RETURNING id_module, description, status, date, created_at, updated_at`;
        const values = [id_module, description, date];
        const {
            rows
        } = await pool.query(text, values);

        // Obtiene el id_course para emitir evento a la sala del curso
        const text2 = `
            SELECT id_course 
            FROM modules
            WHERE id_module = $1`;
        const values2 = [id_module];
        const { id_course } = (await pool.query(text2, values2)).rows[0];
        console.log("ID COURSE: ", id_course);

        let io = socket.getSocket(); // Obtiene el websocket
        console.log(`Emite evento a la sala: ${id_course+'class-section-room'}`)
        io.in(id_course + 'class-section-room').emit('classCreated');

        
        res.status(201).send(rows[0]);
    } catch (error) {
        next({
            error
        });
    }
}

// Actualiza una clase
// + status: 1 = reiniciar, 2=iniciar, 3=finalizar
const updateLesson = async (req, res, next) => {

    try {

        const { id_class } = req.params;
        const {
            id_module,
            description,
            date,
            status
        } = req.body;

        if (status == 2) { // Si se desea iniciar una clase

            // Obtener el 'id_course'
            const text1 = `
                SELECT id_course 
                FROM modules
                WHERE id_module = $1`
            const values1 = [id_module];
            const { id_course } = (await pool.query(text1, values1)).rows[0];

            // Comprobar que no halla otra clase iniciada en el curso
            const text2 = `
                SELECT CASE WHEN EXISTS (
                    SELECT c.status 
                    FROM classes AS c
                    INNER JOIN modules AS m
                    ON c.id_module = m.id_module
                    WHERE m.id_course = $1
                    AND c.id_class != $2
                    AND c.status = 2
                ) THEN TRUE ELSE FALSE END AS any_class_started`;
            const values2 = [id_course, id_class];
            const { any_class_started } = (await pool.query(text2, values2)).rows[0];

            // Si hay una clase iniciada, enviar null para que no se inicie la clase
            if (any_class_started) return res.send(null);
        } 
        /*
        else if (status == 3) { // Si se desea finalizar una clase

            // Finalizar la pregunta iniciada (si es que hay)
            // + Crear transacción
            const text = `
                UPDATE class_question
                SET status = 4
                WHERE id_class = $1`;
            const values = [id_class];
            await pool.query(text, values);
        }
        */

        // Actualiza la clase
        const text = `
            UPDATE classes 
            SET id_module = $1, description = $2, date = $3, status = $4 
            WHERE id_class = $5 
            RETURNING *`;
        const values = [id_module, description, date, status, id_class];
        const class_updated = (await pool.query(text, values)).rows[0];

        // Obtiene el 'id_course' y el 'subject' para emitir el evento a la sala del curso
        const text3 = `
            SELECT m.id_course, s.name AS subject 
            FROM modules AS m
            INNER JOIN courses AS c
            ON m.id_course = c.id_course
            INNER JOIN subjects AS s
            ON c.id_subject = s.id_subject
            WHERE id_module = $1`;
        const values3 = [id_module];
        const {
            id_course,
            subject
        } = (await pool.query(text3, values3)).rows[0];

        let io = socket.getSocket(); // Obtiene el websocket

        // Emite evento a todos los estudiantes que esten en la sección de clases de este curso
        io.in(id_course + 'class-section-room').emit('classUpdated', {});

        // Obtiene el estado original de la clase
        const text1 = `
            SELECT status 
            FROM classes 
            WHERE id_class = $1`;
        const values1 = [id_class];
        const original_status = (await pool.query(text1, values1)).rows[0];

        // Si el estado de la clase se inicia (status = 2) se le notifica a los estudiantes del curso
        // + Posteriormente se puede aplicar el envío de notificaciones móviles
        // + Si estoy en una sala de clases evitar emitir el evento global de que se inicio una clase
        if (status == 2 && original_status != status) {

            // Saber que estudiantes están en la sala
            io.of('/').in(id_course + 'students').clients((error, clients) => {
                console.log("CHIMUELO: ", clients);
            });

            // Emite evento a todos los estudiantes que pertenezcan al curso
            // + Excepto a los que ya esten en la sección de clases (pendiente)
            io.in(id_course + 'students').emit('classStarted', {
                id_course,
                subject
            });

        }

        res.json(class_updated);

    } catch (error) {
        next({
            error
        });
    }
}

// Elimina una clase
const deleteLesson = async (req, res, next) => {

    try {
        const { id_class } = req.params;

        // Elimina la clase en base al 'id_class'
        const text = `
            DELETE FROM classes 
            WHERE id_class = $1 
            RETURNING id_module`;
        const values = [id_class];
        const { id_module } = (await pool.query(text, values)).rows[0];

        // Obtiene el id_class para emitir evento socket
        const text2 = `
            SELECT id_course 
            FROM modules
            WHERE id_module = $1`;
        const values2 = [id_module];
        const { id_course } = (await pool.query(text2, values2)).rows[0];
        
        let io = socket.getSocket(); // Obtiene el websocket
        //console.log(`Emite evento a la sala: ${id_course+'class-section-room'}`)

        // Emite evento a todos los estudiantes que esten en la sección de clases de este curso.    
        io.in(id_course + 'class-section-room').emit('classDeleted');

        res.sendStatus(204);
    } catch (error) {
        next({
            error
        });
    }
}

module.exports = {
    getLessons,
    getClassById,
    getLessonOptions,
    createLesson,
    updateLesson,
    deleteLesson
}