'use strict'

// Load modules
const pool = require('../database');

// Actualiza el estado de participación de un estudiante en una actividad
const updateActivityParticipation = async (req, res, next) => {

    try {
        const { id_activity, id_user } = req.params;
        const {
            status
        } = req.body;

        // Comprobar si existe el registro antes??
        // Actualiza el estado de participación del estudiante en la actividad
        const text = `
            UPDATE activity_user 
            SET status = $1 
            WHERE id_activity = $2 
            AND id_user = $3`;
        const values = [status, id_activity, id_user];
        const response = (await pool.query(text, values)).rows[0];

        res.json(response);

    } catch (error) {
        next({
            error
        });
    }
}

// 
const updateActivityParticipations = async (req, res, next) => {
    
    try {
        const id_activity = parseInt(req.params.id_activity);
        const { array_participation } = req.body; // array_participation: {id_user, status}
        
        // Actualizar múltiples registros en una query: https://stackoverflow.com/questions/37048772/update-multiple-rows-from-multiple-params-in-nodejs-pg
        // Actualizar múltiples registros pasando un array de objetos: https://stackoverflow.com/questions/37059187/convert-object-array-to-array-compatible-for-nodejs-pg-unnest

        // Inserta el 'id_activity' en cada registro del array 'array_participation'
        array_participation.map(participation => Object.assign(participation, {
            id_activity
        }));
        
        const text = `
            UPDATE activity_user AS au 
            SET status = s.status 
            FROM (
                SELECT (a->>'id_activity')::int AS id_activity, (a->>'id_user')::int AS id_user, (a->>'status')::int AS status
                FROM (
                    SELECT jsonb_array_elements(a) AS a
                    FROM (values (($1)::jsonb)) s(a)
                ) AS s 
            ) AS s
            WHERE au.id_activity = s.id_activity 
            AND au.id_user = s.id_user`;
        const values = [JSON.stringify(array_participation)];
        await pool.query(text, values);
        res.json({});

    } catch (error) {
        next({
            error
        })
    }

}

function deleteWinners(array_students, id_activity) {
    const text = `DELETE FROM class_question WHERE (id_question, id_class) IN (SELECT * FROM UNNEST ($1::int[], $2::int[]))`;
    const values = formatWorkspaceArray(array_students, id_activity);
    return {
        text,
        values
    }
}

//ARREGLAR THIS
function insertWinners(array_students, id_activity) {
    const text = `
        UPDATE activity_user 
        SET status = 2
        WHERE id_activity = $2 
        AND id_user = $3`;
    const text = `
        INSERT INTO class_question (id_question, id_class) 
        SELECT * FROM UNNEST ($1::int[], $2::int[])`;
    const values = formatWorkspaceArray(array_students, id_activity);
    return {
        text,
        values
    }
}

module.exports = {
    updateActivityParticipation,
    updateActivityParticipations
}