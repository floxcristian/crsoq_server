'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const pool = require('../database');
//CONSULTAS
const SUBJECTS = `SELECT id_subject, name, created_at, updated_at FROM subjects`;
const SUBJECTS_OPTIONS = `SELECT id_subject, name FROM subjects`
const PAGINATION = ` ORDER BY id_subject LIMIT $1 OFFSET $2`;

async function getSubjects2(req, res) {
    try {

        //PARÁMETROS DE FILTRO OPCIONAL:
        const search = req.query.search;
        const from = Number(req.query.from);
        const limit = Number(req.query.limit);
        const teacher_options = req.query.teacher_options;


        //OBTIENE LOS NOMBRES DE LAS ASIGNATURAS EN DONDE EL PROFESOR HA CREADO CURSOS (PARA EL SELECTOR)
        if (teacher_options) {
            const text = `SELECT s.id_subject, s.name FROM subjects AS s INNER JOIN user_subject AS us ON s.id_subject=us.id_subject WHERE us.id_user = $1 ORDER BY name`;
            const values = [teacher_options]
            const { rows } = await pool.query(text, values);
            return res.send(rows)
        }

        let values, query;
        let promises = [];

        if ((from != undefined) && limit) {
            values = [limit, from];
            query = SUBJECTS;
            if (search) {
                query += ` WHERE name LIKE $3`;
                values.push(`%${search}%`);
            }
            query += `${PAGINATION}`;
            promises.push(pool.query(query, values));
        }
        else {
            query = `${SUBJECTS_OPTIONS} ORDER BY id_subject`;
            promises.push(pool.query(query));
        }


        const { rows } = (await Promise.all(promises))[0];

        res.json({
            subjects: rows
        })
    } catch (error) {
        next({ error });
    }
}


async function getSubjects(req, res, next) {
    try {
        // Query Params
        const search = req.query.search || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        // Obtiene las asignaturas
        const text = `SELECT id_subject, name, created_at, updated_at 
        FROM subjects
        WHERE ($1::varchar IS NULL OR name LIKE $1)
        ORDER BY updated_at
        LIMIT $2
        OFFSET $3`;
        const values = [search, page_size, from];
        const { rows } = await pool.query(text, values);

        // Obtiene la cantidad total de asignaturas (de acuerdo a los parámetros de filtro)
        const text2 = `
         SELECT count(*) 
         FROM subjects
         WHERE ($1::varchar IS NULL OR name LIKE $1)`;
        const values2 = [search];
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
        })
    } catch (error) {
        next({ error });
    }
}

async function getSubjectOptions(req, res, next) {
    try {
        // Query Params
        const id_user = req.query.id_user || null;

        // Obtiene las asignaturas como opción de selector
        const text = `SELECT id_subject, name 
        FROM subjects
        WHERE ($1::int IS NULL OR id_subject IN (
            SELECT id_subject 
            FROM user_subject 
            WHERE id_user = $1))
         ORDER BY name`;
        const values = [id_user];
        const { rows } = await pool.query(text, values);

        // Envía la respuesta al cliente
        res.json(rows);
    } catch (error) {
        next({ error });
    }
}

async function createSubject(req, res) {
    try {
        const {
            name
        } = req.body;

        await pool.query('INSERT INTO subjects(name) VALUES($1)', [name]);
        res.json({ message: 'successfully created subject' })

    } catch (error) {
        next({ error });
    }
}

async function updateSubject(req, res) {
    try {
        const id_subject = req.params.subjectId;
        const {
            name
        } = req.body;

        let text = `
            UPDATE subjects 
            SET name = $1 
            WHERE id_subject = $2 
            RETURNING id_subject, name, created_at, updated_at`;
        let values = [name, id_subject];
        const { rows } = await pool.query(text, values);
        res.json(rows)

    } catch (error) {
        next({ error });
    }
}

async function countSubject(req, res) {
    try {
        const { rows } = await pool.query('SELECT count(*) AS count FROM subjects');
        res.json({
            result: rows[0].count
        });
    }
    catch (error) {
        next({ error });
    }
}

async function deleteSubject(req, res, next) {
    try {
        const id_subject = req.params.subjectId;

        const text = `
            DELETE FROM subjects 
            WHERE id_subject = $1`;
        const values = [id_subject];
        await pool.query(text, values);

        res.sendStatus(204);
    } catch (error) {
        next({ error });
    }
}

module.exports = {
    getSubjects,
    getSubjectOptions,
    createSubject,
    updateSubject,
    deleteSubject,
    countSubject
}