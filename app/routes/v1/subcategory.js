'use strict'

// Load Modules
const express = require('express');
const subcategoryController = require('../../controllers').subcategory;

var api = express.Router();

// Routes and controllers
api.get('/select_options', subcategoryController.getSubcategoryOptions); //Opciones para el Selector
api.get('/last', subcategoryController.getLastSubcategories);
api.get('/', subcategoryController.getSubcategories);
api.post('/', subcategoryController.createSubcategory);
api.put('/:id_subcategory', subcategoryController.updateSubcategory);
api.delete('/:id_subcategory', subcategoryController.deleteSubcategory);
//api.get('/count', categoryController.countCategory);

module.exports = api;