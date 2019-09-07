'use strict'

// Load modules
const pool = require('../database');

//CONSULTAS
const SUBJECTS = `SELECT id_subject, name, created_at, updated_at FROM subjects`;
const SUBJECTS_OPTIONS = `SELECT id_subject, name FROM subjects`
const PAGINATION = ` ORDER BY id_subject LIMIT $1 OFFSET $2`;

async function getSubjects2(req, res, next) {
    try {
        const { search }= req.query;
        const from = Number(req.query.from);
        const limit = Number(req.query.limit);
        const teacher_options = req.query.teacher_options;


        //OBTIENE LOS NOMBRES DE LAS ASIGNATURAS EN DONDE EL PROFESOR HA CREADO CURSOS (PARA EL SELECTOR)
        if (teacher_options) {
            const text = `
                SELECT s.id_subject, s.name 
                FROM subjects AS s 
                INNER JOIN user_subject AS us 
                ON s.id_subject=us.id_subject 
                WHERE us.id_user = $1 
                ORDER BY name`;
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
        });
    } catch (error) {
        next({ error });
    }
}

// Obtiene asignaturas
const getSubjects = async (req, res, next) => {
    try {
      
        const search = req.query.search || null;
        const page_size = req.query.page_size || 20;
        const page = req.query.page || 1;

        // Calcula el from a partir de los params 'page' y 'page_size'
        const from = (page - 1) * page_size;

        // Obtiene las asignaturas
        const text = `
            SELECT id_subject, name, created_at, updated_at 
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
        next({ error });
    }
}

const getSubjectOptions = async (req, res, next) => {
    try {
      
        const id_user = req.query.id_user || null;

        // Obtiene las asignaturas como opción de selector
        const text = `
            SELECT id_subject, name 
            FROM subjects
            WHERE ($1::int IS NULL OR id_subject IN (
                SELECT id_subject 
                FROM user_subject 
                WHERE id_user = $1))
            ORDER BY name`;
        const values = [id_user];
        const { rows } = await pool.query(text, values);
        res.json(rows);
    } catch (error) {
        next({ error });
    }
}

// Crea una asignatura
const createSubject = async (req, res, next) => {
    try {
        const {
            name
        } = req.body;
        const text = `
            INSERT INTO subjects(name) 
            VALUES($1)`;
        const values = [name];
        await pool.query(text, values);
        res.json({ message: 'successfully created subject' })
    } catch (error) {
        next({ error });
    }
}

// Actualiza una asignatura
const updateSubject = async (req, res, next) =>  {
    try {
        const { id_subject } = req.params;
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
        res.json(rows);
    } catch (error) {
        next({ error });
    }
}

// Elimina una asignatura
const deleteSubject = async (req, res, next) => {
    try {
        const { id_subject } = req.params;
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

const countSubject = async (req, res, next) => {
    try {
        const text = `
            SELECT count(*) AS count 
            FROM subjects`;
        const { count } = (await pool.query(text)).rows[0];
        res.json({
            result: count
        });
    }
    catch (error) {
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