"use strict";

// Load modules
const bcrypt = require("bcrypt-nodejs");
const pool = require("../database");

// Obtiene usuarios
const getUsers = async (req, res, next) => {
  try {
    //const search = req.query.search || null;
    const role = req.query.role || null;
    const status = req.query.status || null;
    const page_size = req.query.page_size || 20;
    const page = req.query.page || 1;

    // Calcula el from a partir de los params 'page' y 'page_size'
    const from = (page - 1) * page_size;

    // Obtiene
    const text = `
            SELECT u.id_user, u.name, u.last_name, u.middle_name, u.document, u.email, u.phone, u.username, u.active, u.profile_image, u.created_at, u.updated_at, r.roles
            FROM users AS u 
            INNER JOIN (
                SELECT id_user, array_agg(role ORDER BY role) AS roles 
                FROM roles 
                GROUP BY id_user 
                HAVING ($1::int IS NULL OR $1 = ANY(array_agg(role)))
                ORDER BY id_user
            ) AS r 
            ON u.id_user = r.id_user
            WHERE ($2::bool IS NULL OR u.active = $2)
            ORDER BY id_user 
            LIMIT $3 
            OFFSET $4`;
    const values = [role, status, page_size, from];
    const { rows } = await pool.query(text, values);

    // Obtiene la cantidad total de clases (de acuerdo a los parámetros de filtro)
    const text2 = `
            SELECT count(*) 
            FROM users AS u
            INNER JOIN (
                SELECT id_user
                FROM roles 
                GROUP BY id_user 
                HAVING ($1::int IS NULL OR $1 = ANY(array_agg(role)))
            ) AS r 
            ON u.id_user = r.id_user
            WHERE ($2::bool IS NULL OR u.active = $2)`;
    const values2 = [role, status];
    const { count } = (await pool.query(text2, values2)).rows[0];

    res.json({
      info: {
        total_pages: Math.ceil(count / page_size),
        page: page,
        page_size: page_size,
        total_items: parseInt(count)
      },
      items: rows
    });
  } catch (error) {
    next({
      error
    });
  }
};

const getUserByUserId = async (req, res, next) => {
  try {
    const { id_user } = req.params;

    const text = `
            SELECT id_user, name, last_name, middle_name, document, email, phone, username, active, profile_image, created_at, updated_at 
            FROM users 
            WHERE id_user = $1`;
    const values = [id_user];
    const { rows } = await pool.query(text, values);
    res.json(rows);
  } catch (error) {
    next({
      error
    });
  }
};

const getUsersStudents = async (req, res, next) => {
  try {
    const { id_course, document } = req.query;

    //const text = 'SELECT u.id_user, u.name, u.last_name, u.middle_name, u.document FROM roles AS r INNER JOIN users AS u ON r.id_user = u.id_user WHERE role = 3 AND document = $1';
    const text = `
      SELECT r.id_user, u.name, u.last_name, u.middle_name, u.document, u.username, u.email, 
      CASE WHEN EXISTS (
          SELECT cu.id_user 
          FROM course_user AS cu 
          WHERE cu.id_user = u.id_user 
          AND id_course = $1) 
          THEN TRUE 
          ELSE FALSE END AS enrolled 
      FROM roles AS r 
      INNER JOIN users AS u 
      ON r.id_user = u.id_user 
      WHERE role = 3 
      AND document = $2`;
    const values = [id_course, document];
    const { rows } = await pool.query(text, values);
    res.json({
      items: rows
    });
  } catch (error) {
    next({
      error
    });
  }
};

// Crea un usuario
const createUser = async (req, res, next) => {
  const client = await pool.pool.connect();

  try {
    const {
      name,
      last_name,
      middle_name,
      document,
      email,
      phone,
      username,
      profile_image,
      password,
      roles
    } = req.body;

    if (
      name &&
      last_name &&
      middle_name &&
      document &&
      email &&
      phone &&
      username &&
      password &&
      roles
    ) {
      //COMPRUEBO QUE EL RUT,USERNAME E EMAIL NO EXISTAN  EN LA BASE DE DATOS user.rut.toLowerCase()

      if (roles.length == 0) {
        return res.status(400).send({
          message: "Debe enviar al menos un rol dentrol del array de roles."
        });
      }

      const result_search = await Promise.all([
        pool.query("SELECT id_user FROM users WHERE document = $1", [document]),
        pool.query("SELECT id_user FROM users WHERE username = $1", [username]),
        pool.query("SELECT id_user FROM users WHERE email = $1", [email])
      ]);

      const rows_document = result_search[0].rows;
      const rows_username = result_search[1].rows;
      const rows_email = result_search[2].rows;
      let combination = `${rows_document.length}${rows_username.length}${rows_email.length}`;

      switch (combination) {
        case "111":
          return res.status(500).json({
            status: "111",
            message: `this document, username and email has been taken`
          });
        case "110":
          return res.status(500).json({
            status: "110",
            message: `this document and username has been taken`
          });
        case "101":
          return res.status(500).json({
            status: "101",
            message: `this document and email has been taken`
          });
        case "011":
          return res.status(500).json({
            status: "011",
            message: `this username and email has been taken`
          });
        case "100":
          return res.status(500).json({
            status: "100",
            message: `this document has been taken`
          });
        case "010":
          return res.status(500).json({
            status: "010",
            message: `this username has been taken`
          });
        case "001":
          return res.status(500).json({
            status: "001",
            message: `this email has been taken`
          });
        default:
          let salt = bcrypt.genSaltSync(10); // Hashea la password
          //INICIA LA TRANSACCIÓN
          client.query("BEGIN");

          // Inserta al usuario
          const text1 = `
            INSERT INTO users(name, last_name, middle_name, document, email, phone, username, password) 
            VALUES($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING id_user, name, last_name, middle_name, document, email, phone, username, password, active, profile_image, created_at, updated_at`;
          const values1 = [
            name,
            last_name,
            middle_name,
            document,
            email,
            phone,
            username,
            bcrypt.hashSync(password, salt)
          ];
          const user = (await client.query(text1, values1)).rows[0];

          //INSERCIÓN DE ROL
          const { text, values } = insertRoles(roles, user.id_user);
          await client.query(text, values);

          await client.query("COMMIT"); // Finaliza la transacción

          //const roles = await pool.query('INSERT INTO roles(id_user, role) VALUES($1, $2)', [rows[0].id_user, '3']);
          //GENERO EL TOKEN CON DATOS DE USUARIO Y ROLES
          res.json({
            message: "successfully created user",
            user
          });
      }
    } else {
      await client.query("ROLLBACK");
      res.status(400).send({
        message: "send all necessary fields"
      });
    }
  } catch (error) {
    next({
      error
    });
  } finally {
    client.release();
  }
};

const updateUser = async (req, res, next) => {
  const client = await pool.pool.connect();

  try {
    const { id_user } = req.params;
    const {
      name,
      last_name,
      middle_name,
      document,
      email,
      phone,
      username,
      active,
      add_roles,
      delete_roles
    } = req.body;

    let user;

    if (req.user_payload.roles.includes(1)) {
      //SI SOY ADMIN: PUEDO MODIFICAR EL ACTIVE Y LOS ROLES

      let promises = [];

      client.query("BEGIN"); // Inicia la transacción

      // Consulta para actualizar el usuario
      const q_update_us =
        `UPDATE users 
        SET name = $1, last_name = $2, middle_name = $3, document = $4, email = $5, phone = $6, username = $7, active = $8 
        WHERE id_user = $9 
        RETURNING id_user, name, last_name, middle_name, document, email, phone, username, password, active, profile_image, created_at, updated_at`;
      const v_update_us = [
        name,
        last_name,
        middle_name,
        document,
        email,
        phone,
        username,
        active,
        id_user
      ];
      // Agrega la query al array 'promises'
      promises.push(client.query(q_update_us, v_update_us));

      // Si el array 'add_roles' existe y viene con algún rol para agregar
      if (add_roles && add_roles.length > 0) {
        //INSERCIÓN DE ROL
        const { text, values } = insertRoles(add_roles, id_user);
        // Agrega la query al array 'promises'
        promises.push(client.query(text, values));
      }
      if (delete_roles && delete_roles.length > 0) {
        delete_roles.push(32); // Porque push(32)?
        const { text, values } = deleteRoles(delete_roles, id_user);
        promises.push(client.query(text, values));
      }

      // Resuelvo el array de consultas
      const result_update = await Promise.all(promises);

      //
      result_update.map(result => {
        if (result.command == "DELETE") {
          console.log(result);
          console.log(
            `result.rowCount: ${result.rowCount}, delete_roles.length: ${delete_roles.length}`
          );
          //if(result.rowCount != delete_roles.length)
        }
      });

      await client.query("COMMIT"); // Finaliza la transacción

      // Obtiene los datos del usuario actualizado (result_update[0] para obtener los datos de la query de actualización)
      user = result_update[0].rows[0];
    } else if (id_user != req.user_payload.id_user) {
      //SI SOY DUEÑO DEL ID
      let text = `
        UPDATE users 
        SET name = $1, last_name = $2, middle_name = $3, document = $4, email = $5, phone = $6, username = $7 
        WHERE id_user = $8 
        RETURNING id_user, name, last_name, middle_name, document, email, phone, username, password, active, profile_image, created_at, updated_at`;
      let values = [
        name,
        last_name,
        middle_name,
        document,
        email,
        phone,
        username,
        id_user
      ];

      user = await pool.query(text, values);
    } else {
      return res.status(500).json({
        message: `you don't have permission to update user data`
      });
    }

    //RECUPERO ROLES, QUITO LA CONTRASEÑA Y ENVIO RESPONSE...
    const text3 = `
            SELECT array_agg(role ORDER BY role) AS roles 
            FROM roles 
            WHERE id_user = $1`;
    const values3 = [id_user];
    const _roles = (await pool.query(text3, values3)).rows;
    user.roles = _roles[0].roles;
    delete user.password;

    res.json({
      user: user
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next({
      error
    });
  } finally {
    client.release();
  }
};

//NO ME DEJA BORRAR PORQUE DEPENDE DE TABLA ROLE...
// Elimina un usuario
const deleteUser = async (req, res, next) => {
  try {
    const { id_user } = req.params;
    const text = `
    DELETE FROM users 
    WHERE id_user = $1`;
    const values = [id_user];
    await pool.query(text, values);
    res.json({
      message: "successfully deleted user"
    });
  } catch (error) {
    next({
      error
    });
  }
};

const disableUser = async (req, res, next) => {
  try {
    const { id_user } = req.params;
    const text = `
      UPDATE users 
      SET active = false 
      WHERE id_user = $1`;
    const values = [id_user];
    await pool.query(text, values);
    res.json({
      message: "successfully disabled user"
    });
  } catch (error) {
    next({
      error
    });
  }
};
// function login(req, res) {
//     var params = req.body;

//     var rut = params.rut;
//     var password = params.password;

//     //COMPROBAR SI EL RUT Y LA CONTRASEÑA QUE ME ESTAN ENVIANDO COINCIDEN CON ALGUNA EN LA BASE DE DATOS
//     if (user) {
//         //bcrypt.compare() password que le paso y password almacenada en al db
//     }

// }

// function logout(req, res) {
//     var params = req.body;
// }

//FUNCIONES NO EXPORTABLES************************************************************************************

function searchName(search_value, index) {
  let mquery, mvalues;
  let array_search = search_value.split(" ");

  if (array_search.length == 2) {
    mquery = `(u.name = $${index} OR u.last_name = $${index}) AND (u.last_name LIKE $${index +
      1} OR u.middle_name LIKE $${index + 1})`;
    mvalues = [`${array_search[0]}`, `%${array_search[1]}%`];
  } else if (array_search.length == 3) {
    mquery = `u.name = $${index} AND u.last_name = $${index +
      1} AND u.middle_name LIKE $${index + 2}`;
    mvalues = [
      `${array_search[0]}`,
      `${array_search[1]}`,
      `%${array_search[2]}%`
    ];
  } else {
    //EXCELENTE: PARA CUANDO SEA 1 STRING O MAS DE 3
    mquery = `CONCAT(u.name, ' ', u.last_name, ' ', u.middle_name) LIKE $${index}`;
    mvalues = [`%${array_search[0]}%`];
  }

  return {
    mquery,
    mvalues
  };
}

function searchAnything(search_value, index) {
  let mquery, mvalues;
  if (/^[0-9a-zA-Z_.-]*@[0-9a-zA-Z]*.?[a-z]*$/.test(search_value)) {
    mquery = `email LIKE $${index}`;
    mvalues = [`%${search_value}%`];
  }
  //SI ES "SOLO" NUMERO ENTONCES ES RUT
  else if (/^[0-9]+$/.test(search_value)) {
    mquery = `document LIKE $${index}`;
    mvalues = [`${search_value}%`];
  }
  //SI TIENE 2 O 3 PALABRAS ENTONCES ES NOMBRE
  else if (/^([a-zA-Z]+( [a-zA-Z]+){1,2}$)/.test(search_value)) {
    ({ mquery, mvalues } = searchName(search_value, index));
  }
  //SI TIENE LETRAS, NÚMEROS Y CARÁCTERES ESPECIALES ES USUARIO
  else if (/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[-_.])/.test(search_value)) {
    //ESTOY DICIENDO SI TIENE SOLAMENTE LETRAS O NUMEROS PERO NO OBLIGO A QUE TENGA AMBAS (DIGO LETRAS, NUMEROS "O" CARACTERES EPSECIALES)
    mquery = `username LIKE $${index}`;
    mvalues = [`%${search_value}%`];
  }
  //SI TIENE LETRAS Y NÚMEROS ES USUARIO O RUT (WARN: el rut lo puede buscar con punto y guion)
  else if (/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(search_value)) {
    mquery = `(username LIKE $${index} OR document LIKE $${index})`;
    mvalues = [`%${search_value}%`];
  }
  //POR DEFECTO BUSCA SOLO EN NOMBRE
  else {
    ({ mquery, mvalues } = searchName(search_value, index));
  }

  return {
    mquery,
    mvalues
  };
}

const countUser = async (req, res, next) => {
  try {
    const text = `
      SELECT count(*) AS count 
      FROM users`;
    const { count } = (await pool.query(text)).rows[0];
    res.json({
      result: count
    });
  } catch (error) {
    next({
      error
    });
  }
};

const insertRoles = (array_roles, id_user) => {
  const text = `
    INSERT INTO roles (id_user, role) 
    SELECT * FROM UNNEST ($1::int[], $2::int2[])`;
  const values = formatRolesArray(array_roles, id_user);
  return {
    text,
    values
  }
};

const deleteRoles = (array_roles, id_user) => {
  const text = `
    DELETE FROM roles 
    WHERE (id_user, role) 
    IN (SELECT * FROM UNNEST ($1::int[], $2::int2[]))`;
  const values = formatRolesArray(array_roles, id_user);
  return {
    text,
    values
  }
}

const formatRolesArray = (array_roles, id_user) => {
  let values1 = []; //[id_user, id_user, id_user]
  let values2 = []; //[role1, role2, role3]

  array_roles.map(role => {
    values1.push(id_user);
    values2.push(role);
    // Mejor Opción:
    //return [id_user, role];
  });
  //values1.push(28);
  //values2.push(4);

  return [values1, values2];
}

// Devuelve un array de tuplas [id_user, role]
function formatRolesArray2(array_roles, id_user) {
  return array_roles.map(role => [id_user, role]);
}

module.exports = {
  getUsers,
  getUserByUserId,
  getUsersStudents,
  createUser,
  updateUser,
  deleteUser,
  disableUser,
  countUser
};
