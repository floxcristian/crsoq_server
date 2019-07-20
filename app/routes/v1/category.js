'use strict'

// Load modules
const express = require('express');
const { categoryCtrl } = require('../../controllers');

var api = express.Router();

// Routes and controllers
api.get('/select_options', categoryCtrl.getCategoryOptions); //Opciones para el Selector
api.get('/last', categoryCtrl.getLastCategories);
api.get('/', categoryCtrl.getCategories);
api.post('/', categoryCtrl.createCategory);
api.put('/:id_category', categoryCtrl.updateCategory);
api.delete('/:id_category', categoryCtrl.deleteCategory);
//api.get('/count', categoryCtrl.countCategory);

module.exports = api;