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

// Actualiza un conjunto de participaciones en una actividad
//> + Pero si no existe no hace nada... (no inserta)
const updateActivityParticipations = async (req, res, next) => {

    try {
        const id_activity = parseInt(req.params.id_activity);
        const { 
            //array_participation,
            add_winners,
            delete_winners
        } = req.body; // array_participation: {id_user, status}


        // Actualizar múltiples registros en una query: https://stackoverflow.com/questions/37048772/update-multiple-rows-from-multiple-params-in-nodejs-pg
        // Actualizar múltiples registros pasando un array de objetos: https://stackoverflow.com/questions/37059187/convert-object-array-to-array-compatible-for-nodejs-pg-unnest

        // Inserta el 'id_activity' en cada registro del array 'array_participation'
        /*
       
        Actualiza el estado de un estudiante
        const text = `
            INSERT INTO user_question_class(id_user, id_class, id_question, status) 
            VALUES($1, $2, $3, 3) 
            ON CONFLICT ON CONSTRAINT pk_user_question_class DO UPDATE SET status = 3, update_date = DEFAULT`;
        const values = [id_user, id_class, id_question];
        await pool.query(text, values);
        
        */
        // array_participation.map(participation => Object.assign(participation, {
        //     id_activity
        // }));

        const client = await pool.pool.connect();
        client.query('BEGIN'); // Inicia la transacción
        let promises = []; // Array para ejecutar consultas en paralelo

        if (add_winners && add_winners.length > 0) {
            const {
                text,
                values
            } = insertWinners(add_winners, id_activity);
            // Agrega la query al array 'promises'
            promises.push(client.query(text, values));
        }

        if (delete_winners && delete_winners.length > 0) {
            const {
                text,
                values
            } = deleteWinners(delete_winners, id_activity);
            promises.push(client.query(text, values));
        }

        await Promise.all(promises);
        await client.query('COMMIT'); // Finaliza la transacción

        res.json({});
        /*
      
        //> No se actualiza
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
        console.log("values: ", values);
        await pool.query(text, values);
        res.json({});
*/
        /*
        const text2 = `
            SELECT id_user, id_activity, status
            FROM activity_user AS au
            WHERE au.id_activity = $1`;
        const values2 = [id_activity];
        const { rows } = await pool.query(text2, values2);
        console.log("update?: ", rows);*/

    } catch (error) {
        next({
            error
        })
    }

}

const deleteWinners = (array_students, id_activity) => {
    const text = `
        DELETE FROM activity_user 
        WHERE (id_user, id_activity) 
        IN (SELECT * FROM UNNEST ($1::int[], $2::int[]))`;
    const values = formatWorkspaceArray(array_students, id_activity, 1);
    return {
        text,
        values
    }
}


const insertWinners = (array_students, id_activity) => {
    const text = `
        INSERT INTO activity_user (id_user, id_activity, status) 
        SELECT * FROM UNNEST ($1::int[], $2::int[], $3::int[])`;
    const values = formatWorkspaceArray(array_students, id_activity, 2);
    return {
        text,
        values
    }
}

const formatWorkspaceArray = (array_students, id_activity, status) => {
    let values1 = []; //[id_user1, id_user2, id_user3]
    let values2 = []; //[id_activity, id_activity, id_activity]
    let values3 = []; //[status, status, status]

    array_students.map((id_user) => {
        values1.push(id_user);
        values2.push(id_activity);
        if(status == 2) values3.push(status);
    });

    if(status == 2) return [values1, values2, values3];
    else return [values1, values2];
}


module.exports = {
    updateActivityParticipation,
    updateActivityParticipations
}