'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const status = require('http-status');
//const uuid4 = require('uuid/v4');
const pool = require('../database');

// ----------------------------------------
// Get Calendars
// ----------------------------------------
async function getCalendars(req, res, next) {
    try {
        // Query Params
        const year = req.query.year || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        const text = `
        SELECT id_calendar, year, semester, created_at, updated_at
        FROM calendars
        WHERE ($1::int IS NULL OR year = $1)
        ORDER BY id_calendar 
        LIMIT $2 
        OFFSET $3`;
        const values = [year, page_size, from];
        const { rows } = await pool.query(text, values);

        const text2 = `
        SELECT count(*) 
        FROM calendars
        WHERE ($1::int IS NULL OR year = $1)`;
        const values2 = [year];
        const total_items = (await pool.query(text2, values2)).rows[0].count;

         // Envía la respuesta al cliente
         res.json({
            info: {
                total_pages: Math.ceil(total_items / page_size),
                page: page,
                page_size: page_size,
                total_items: parseInt(total_items),
            },
            items: rows
        });

    } catch (error) {
        next({ error});
    }
}

// ----------------------------------------
// Get Calendars as Select Options
// ----------------------------------------
async function getCalendarOptions(req, res, next) {
    try {
        // Obtiene las categorías
        const text = `
        SELECT id_calendar, year, semester 
        FROM calendars 
        ORDER BY year, semester`;
        const { rows } = await pool.query(text);

        // Envía la respuesta al cliente
        res.json(rows);
    } catch (error) {
        next({ error });
    }
}
// ----------------------------------------
// Create Calendar
// ----------------------------------------
async function createCalendar(req, res, next) {

    try {
        const {
            year,
            semester
        } = req.body;

        const text = 'INSERT INTO calendars(year, semester) VALUES($1, $2)';
        const values = [year, semester];
        const result = (await pool.query(text, values)).rows[0];
        res.status(status.CREATED)
            .send();


    } catch (error) {
        next({ error});
    }
}

// ----------------------------------------
// Update Calendar
// ----------------------------------------
async function updateCalendar(req, res, next) {
    try {
        const id_calendar = req.params.calendarId;
        const {
            year,
            semester
        } = req.body;

        const text1 = 'SELECT id_calendar FROM calendars WHERE id_calendar = $1';
        const values1 = [id_calendar];
        const res1 = (await pool.query(text1, values1)).rows[0];
        // next({ status: 404, message: 'Calendar not Found.' })
        if (!res1) {
            return res.status(status.NOT_FOUND)
                .send({ message: 'calendar not found' })
        }

        const text2 = 'UPDATE calendars SET year = $1, semester = $2 WHERE id_calendar = $3 RETURNING id_calendar, year, semester, created_at, updated_at';
        const values2 = [year, semester, id_calendar];
        const res2 = (await pool.query(text2, values2)).rows[0];
        res.json(res2)

    } catch (error) {
        next({ error});
    }
}

// ----------------------------------------
// Delete Calendar
// ----------------------------------------
async function deleteCalendar(req, res, next) {
    try {
        const id_calendar = req.params.calendarId;
        const text = `DELETE FROM calendars WHERE id_calendar = $1`;
        const values = [id_calendar];
        const {
            rows
        } = await pool.query(text, values);
        res.sendStatus(204);
    } catch (error) {
        next({ error});
    }
}

// ----------------------------------------
// Get Count Calendar
// ----------------------------------------
async function countCalendar(req, res) {

    try {
        const text = 'SELECT count(*) FROM calendars';
        const {
            rows
        } = await pool.query(text);

        res.json({  
            result: rows[0].count
        });
    } catch (error) {
        next({ error});
    }
    
}

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {
    getCalendars,
    getCalendarOptions,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    countCalendar
}