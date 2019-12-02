//ESTRUCTURA DE NODE-POSTGRES BASADA EN LA DOC.
//https://node-postgres.com/guides/project-structure
//CONSEJOS DEL CREADOR DE NODE-POSTGRES:
//https://gist.github.com/brianc/f906bacc17409203aee0
//CONSEJOS COMPLEMENTAR PG CON 
//https://engineering.smrxt.com/tinypg-for-postgres-queries/
//https://www.wlaurance.com/2016/09/node.js-postgresql-transactions-and-query-examples/
//https://stackoverflow.com/questions/52787289/how-to-pool-postgresql-connections-in-nodejs-with-facade-design-pattern
//https://www.wlaurance.com/2016/09/node.js-postgresql-transactions-and-query-examples/
'use strict'

// Load modules
const Pool = require('pg').Pool;
const colors = require('colors');
const _config_db = require('../config/config');

// Init DB Pool
const pool = new Pool(_config_db);


/*
(async () => {
  const text = 'SELECT * FROM colrs'

  try {
    const res = await pool.query(text)
    console.log(res.rows[0])
    } catch (err) {
    console.log(typeof(err.stack))
    console.log(err.stack)
  }
})()*/

//EXPORTAR TRANSACCIONES
/*
(async () => {
  // note: we don't try/catch this because if connecting throws an exception
  // we don't need to dispose of the client (it will be undefined)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const {
      rows
    } = await client.query('INSERT INTO users(name) VALUES($1) RETURNING id', ['brianc'])

    const insertPhotoText = 'INSERT INTO photos(user_id, photo_url) VALUES ($1, $2)'
    const insertPhotoValues = [res.rows[0].id, 's3.bucket.foo']
    await client.query(insertPhotoText, insertPhotoValues)
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
})().catch(e => console.error(e.stack))
*/

/*
async function transaction(q) {
  const client = await pool.connect()
  let res
  try {
    await client.query('BEGIN')
    try {
      res = await client.query(q)
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  } finally {
    client.release()
  }
  return res
}
*/

// ----------------------------------------
// Create Database Tables (Read SQL File)
// ----------------------------------------
//++


// Obtiene el estado de la base de datos
(async () => {

  const {
    port,
    host,
    database
  } = _config_db;

  try {
    const text = `
      SELECT * 
      FROM pg_stat_activity 
      WHERE datname = $1`;
    const values = [database];
    const res = (await pool.query(text, values)).rows[0];
    console.log(`${colors.green.bold('[SUCCESS]'.padStart(10))} database is running on ${res.client_addr}:${port}`);
  } catch (error) {
    console.log(`${colors.red.bold('[ERROR]'.padStart(10))} database is not running on ${host}:${port}`);
    //process.exit(-1); // Cierra la aplicación
    //console.log(error)
  }
})();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
}