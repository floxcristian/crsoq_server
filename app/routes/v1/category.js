'use strict'

// Load modules
const express = require('express');
const categoryController = require('../../controllers').category;

var api = express.Router();

// Routes and controllers
api.get('/select_options', categoryController.getCategoryOptions); //Opciones para el Selector
api.get('/last', categoryController.getLastCategories);
api.get('/', categoryController.getCategories);
api.post('/', categoryController.createCategory);
api.put('/:id_category', categoryController.updateCategory);
api.delete('/:id_category', categoryController.deleteCategory);
//api.get('/count', categoryController.countCategory);

module.exports = api;