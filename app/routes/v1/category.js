'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const express = require('express');
const categoryController = require('../../controllers').category;

var api = express.Router();

// ----------------------------------------
// Routes and Controllers
// ----------------------------------------
api.get('/select_options', categoryController.getCategoryOptions); //Opciones para el Selector
api.get('/last', categoryController.getLastCategories);
api.get('/', categoryController.getCategories);
api.post('/', categoryController.createCategory);
api.put('/:categoryId', categoryController.updateCategory);
api.delete('/:categoryId', categoryController.deleteCategory);
//api.get('/count', categoryController.countCategory);

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = api;