"use strict";

// Load modules
const pool = require("../database");

// Obtiene módulos
const getModules = async (req, res, next) => {
  try {
    const { id_course } = req.query;

    if (id_course) {
      const text = `SELECT id_module, id_course, name, position, created_at, updated_at FROM modules WHERE id_course = $1`;
      const values = [id_course];
      const { rows } = await pool.query(text, values);
      //const total_items = rows.length != 0 ? rows[0].count : 0;
      res.json(rows);
    } else {
      res.status(400).json({
        message: "send all necessary fields"
      });
    }
  } catch (error) {
    next({ error });
  }
};

// Get Modules as Select Options
const getModuleOptions = async (req, res, next) => {
  try {
    const { id_course } = req.query;

    // Obtiene los módulos
    const text = `
        SELECT id_module, name 
        FROM modules 
        WHERE id_course = $1`;
    const values = [id_course];
    const { rows } = await pool.query(text, values);

    res.json(rows);
  } catch (error) {
    next({ error });
  }
};

// Crea un módulo
const createModule = async (req, res, next) => {
  try {
    const { id_course, name } = req.body;

    if ((id_course, name)) {
      const { rows } = await pool.query(
        `INSERT INTO modules(id_course, name) VALUES($1, $2)`,
        [id_course, name]
      );
      res.json({
        message: "successfully created module"
      });
    } else {
      res.status(400).json({
        message: "send all necessary fields"
      });
    }
  } catch (error) {
    next({ error });
  }
};

// Elimina un módulo
const deleteModule = async (req, res, next) => {
  try {
    const { id_module } = req.params;

    const text = `
            DELETE FROM modules 
            WHERE id_module = $1`;
    const values = [id_module];
    await pool.query(text, values);
    res.sendStatus(204);
  } catch (error) {
    next({ error });
  }
};

// Actualiza un módulo
const updateModule = async (req, res, next) => {
  try {
    const { id_module } = req.params;
    const { name } = req.body;

    const text = `
      UPDATE modules 
      SET name = $1 
      WHERE id_module = $2 
      RETURNING id_module, id_course, name, position, created_at, updated_at`;
    const values = [name, id_module];
    const { rows } = await pool.query(text, values);
    res.json(rows[0]);
  } catch (error) {
    next({ error });
  }
};

module.exports = {
  getModules,
  getModuleOptions,
  createModule,
  deleteModule,
  updateModule
};
