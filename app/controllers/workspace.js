'use strict'

// Load modules
const pool = require('../database');

// Si necesito las últimas 5 del profe debo enviar page_size=5 y solo el user_id

// Obtiene los workspaces en los que esta el profesor
const getWorkspaces = async (req, res, next) => {
    try {

        const { id_user } = req.query;

        // Calcula el from a partir de los params 'page' y 'page_size'
        //const from = (page - 1) * page_size;
        const text = `
            SELECT us.id_subject, s.name
            FROM user_subject AS us 
            INNER JOIN subjects AS s
            ON us.id_subject = s.id_subject
            WHERE us.id_user = $1`;
        const values = [id_user];
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

// Actualiza los workspaces en los que esta el profesor
const updateWorkspaces = async (req, res, next) => {

    const client = await pool.pool.connect();

    try {

        const {
            id_user,
            add_workspaces,
            delete_workspaces
        } = req.body;

        client.query('BEGIN'); // Inicia la transacción
        let promises = []; // Array para ejecutar consultas en paralelo

        if (add_workspaces && add_workspaces.length > 0) {
            console.log("ADD WORKSPACES...");
            const {
                text,
                values
            } = insertWorkspaces(add_workspaces, id_user);
            promises.push(client.query(text, values)); // Agrega la query al array 'promises'

            // Crea la categoría por defecto
            const text2 = `
                INSERT INTO categories(id_user, id_subject) 
                SELECT * FROM UNNEST ($1::int[], $2::int[]) 
                RETURNING id_category`;
            let categories_created = (await client.query(text2, values)).rows;

            categories_created = categories_created.map(item => item.id_category);
            console.log("CATEGORY CREATED: ", categories_created);
            // Crea la subcategoría por defecto
            const text3 = `
                INSERT INTO subcategories(id_category) 
                SELECT * FROM UNNEST ($1::int[])`;
            await client.query(text3, [categories_created]);

            // INSERT INTO categories(id_category, id_user, id_subject, name) 
            // VALUES(CONCAT('_', LEFT(uuid_generate_v4()::text, 7)) ,$1, $2, $3)

        }

        if (delete_workspaces && delete_workspaces.length > 0) {

            // OPC1: Antes, verificar si hay categorías aparte de la DEFAULT en cada uno de los SUBJECTS
            // OPC2: Antes, verificar si hay cursos en los workspaces
            // NOTA: En 'delete_workspaces' estan los 'id_subject'

            let promises3= [];
            // Obtener cursos del profesor de las asignaturas que se quieren eliminar (input: array de id_subject)
            const text1 = `
                SELECT count(*) AS n_courses
                FROM courses AS c
                WHERE c.id_user = $1 
                AND c.id_subject = ANY($2::int[])`;
            const values1 = [id_user, delete_workspaces];
            promises3.push(client.query(text1, values1));

            const text2 = `
                    SELECT count(*) AS n_questions
                    FROM questions AS q
                    INNER JOIN subcategories AS s
                    ON q.id_subcategory = s.id_subcategory
                    INNER JOIN categories AS c
                    ON s.id_category = c.id_category
                    WHERE c.id_user = $1
                    AND c.id_subject = ANY($2::int[])`;
            const values2 = [id_user, delete_workspaces];
            promises3.push(client.query(text2, values2));


            const results = await Promise.all(promises3);

            const n_courses = parseInt(results[0].rows[0].n_courses);
            const n_questions = parseInt(results[1].rows[0].n_questions);
            console.log("n_courses: ", n_courses);
            console.log("n_questions: ", n_questions);

            if (n_courses > 0 || n_questions > 0) { // Mensaje no se puede eliminar porque hay cursos
                console.log("no se puede eliminar porque tiene cursos o preguntas");
                return res.status(500).send();
            }
            else { // No hay cursos pero se deben verificar otras cosas?
                // Obtener preguntas de cada asignatura a eliminar
                console.log("vamos a ver si se crearon categorías o subcategorías...");

                let promises2 = [];

                // Obtener categorías
                const text1 = `
                    SELECT c.id_subject, c.id_category, c.name AS category
                    FROM categories AS c
                    WHERE c.id_user = $1 
                    AND c.id_subject = ANY($2::int[])`;
                const values1 = [id_user, delete_workspaces];
                promises2.push(client.query(text1, values1));

                // Obtener subcategorías
                const text2 = `
                    SELECT c.id_subject, c.id_category, c.name AS category, s.id_subcategory, s.name AS subcategory
                    FROM categories AS c
                    INNER JOIN subcategories AS s
                    ON c.id_category = s.id_category
                    WHERE c.id_user = $1 
                    AND c.id_subject = ANY($2::int[])`;
                const values2 = [id_user, delete_workspaces];
                promises2.push(client.query(text2, values2));

                const results = await Promise.all(promises2);
                const categories = results[0].rows;
                const subcategories = results[1].rows;
                console.log("categories: ", categories);
                console.log("subcategories: ", subcategories);

                /// Formatear array de ids
                let f_categories = [];
                categories.forEach(category => f_categories.push(parseInt(category.id_category)));
                let f_subcategories = [];
                subcategories.forEach(subcategory => f_subcategories.push(parseInt(subcategory.id_subcategory)));

                console.log("f_categories: ", f_categories);
                console.log("f_subcategories: ", f_subcategories);

                /*
                let categories_by_subject = groupByCategory(categories);

                let error_n_categories = false;
                // Agrupar categorías y subcategorías por asignatura
                categories_by_subject.forEach(subject => {
                    //console.log("subject: ", subject);
                    if(subject.n_categories > 1) error_n_categories = true;
                });
                console.log("error: ", error_n_categories);
                if(error_n_categories) return res.status(500).send();
                
                let subcategories_by_category;
                console.log("paso.....");
                
                // Elimino todas las subcategorias y categorias


                //> Si hay solo una categoría y subcategoría
                let promises3 = [];*/

                // Elimina todas las subcategorías de las asignturas seleccionadas por el profesor
                const textn = `
                    DELETE FROM subcategories   
                    WHERE (id_subcategory) 
                    IN (SELECT * FROM UNNEST ($1::int[]))`;
                const valuesn = [f_subcategories];
                await pool.query(textn, valuesn);

                // Elimina todas las categorías de las asignturas seleccionadas por el profesor
                const textm = `
                    DELETE FROM categories   
                    WHERE (id_category) 
                    IN (SELECT * FROM UNNEST ($1::int[]))`;
                const valuesm = [f_categories];
                await pool.query(textm, valuesm);

                // Eliminar asignaturas...
                console.log("ELIMIANDO LA WA...")
                console.log("delete_workspaces: ", delete_workspaces);
                console.log("id_user: ", id_user);
                const {text, values} = deleteWorkspaces(delete_workspaces, id_user);
              
                //console.log(`texth: ${texth}, valuesh: ${valuesh}`);
                promises.push(client.query(text, values)); // Agrega la query al array 'promises'*/
                
                //console.log("DELETIANDO: ", results);
            }
         
            await Promise.all(promises3);
            console.log("DELETE WORKSPACES...");
        }


        await Promise.all(promises);
        await client.query('COMMIT'); // Finaliza la transacción

        res.json({});

    } catch (error) {
        await client.query('ROLLBACK');
        next({
            error
        });
    } finally {
        client.release();
    }
}

const groupByCategory = (array) => {
    const group_to_values = array.reduce((obj, item) => {
        obj[item.id_subject] = obj[item.id_subject] || [];
        obj[item.id_subject].push({ id_category: item.id_category, category: item.category });
        return obj;
    }, {});

    const groups = Object.keys(group_to_values).map((id_subject) => {
        return { id_subject: id_subject, n_categories: group_to_values[id_subject].length, categories: group_to_values[id_subject] };
    });

    console.log("lalo: ", JSON.stringify(groups));
    return groups;
};

const insertWorkspaces = (array_workspaces, id_user) => {
    const text = `
        INSERT INTO user_subject (id_user, id_subject) 
        SELECT * FROM UNNEST ($1::int[], $2::int[])`;
    const values = formatWorkspaceArray(array_workspaces, id_user);

    // Se podría crear id por defecto no númerico: CONCAT('_', LEFT(uuid_generate_v4()::text, 7))
    return {
        text,
        values
    }
}


// Get Categories as Select Options
async function getCategoryOptions(req, res, next) {
    try {
        // Query Params
        const id_user = req.query.id_user; // Obligatorio por ahora    
        const id_subject = req.query.id_subject; // Obligatorio por ahora  

        // Obtiene las categorías
        const text = `
            SELECT id_category, name 
            FROM categories 
            WHERE id_user = $1 
            AND id_subject = $2 
            ORDER BY name`;
        const values = [id_user, id_subject];
        const {
            rows
        } = await pool.query(text, values);

        // Envía la respuesta al cliente
        res.json(rows);
    } catch (error) {
        next({
            error
        });
    }
}

// Create Category
async function createCategory(req, res, next) {

    try {
        const {
            id_user,
            id_subject,
            name
        } = req.body;

        if (id_user && id_subject && name) {

            const text = `
                INSERT INTO categories(id_user, id_subject, name) 
                VALUES($1, $2, $3)`;
            const values = [id_user, id_subject, name]
            const {
                rows
            } = await pool.query(text, values);

            res.status(201).send(rows[0]);
        } else {
            res.status(400).json({
                message: 'send all necessary fields'
            });
        }
    } catch (error) {
        next({
            error
        });
    }
}

// Delete Category
async function deleteCategory(req, res, next) {
    try {
        const id_category = req.params.categoryId;
        const text = 'DELETE FROM categories WHERE id_category = $1';
        const values = [id_category];
        await pool.query(text, values);

        // Envía la respuesta al cliente
        res.sendStatus(204);
    } catch (error) {
        next({
            error
        });
    }
}

// Enviar solo los workspaces que no tienen categorias y subcatecogias diferentes a DEFAULT
const deleteWorkspaces = (array_workspaces, id_user) => {

    // Eliminar las categorias y subcategorias por DEFAULT
    const text = `
        DELETE FROM user_subject 
        WHERE (id_user, id_subject) 
        IN (SELECT * FROM UNNEST ($1::int[], $2::int2[]))`;
    const values = formatWorkspaceArray(array_workspaces, id_user);
  
    return {
        text,
        values
    }
}

const formatWorkspaceArray = (array_workspaces, id_user) => {
    let values1 = []; //[id_user, id_user, id_user]
    let values2 = []; //[workspace1, workspace2, workspace3]

    array_workspaces.map((workspace) => {
        values1.push(id_user);
        values2.push(workspace);
    });

    return [values1, values2];
}

/*function formatForSubcategory(id_category) {
    let values1 = []; //[id_user, id_user, id_user]

    array_workspaces.map((workspace) => {
        values1.push(id_category);
    });

    return [values1]
}*/

module.exports = {
    getWorkspaces,
    updateWorkspaces
}