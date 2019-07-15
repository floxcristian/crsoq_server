'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const express = require('express');
const subcategoryController = require('../../controllers').subcategory;

var api = express.Router();

// ----------------------------------------
// Routes and Controllers
// ----------------------------------------
api.get('/select_options', subcategoryController.getSubcategoryOptions); //Opciones para el Selector
api.get('/last', subcategoryController.getLastSubcategories);
api.get('/', subcategoryController.getSubcategories);
api.post('/', subcategoryController.createSubcategory);
api.put('/:subcategoryId', subcategoryController.updateSubcategory);
api.delete('/:subcategoryId', subcategoryController.deleteSubcategory);
//api.get('/count', categoryController.countCategory);

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = api;