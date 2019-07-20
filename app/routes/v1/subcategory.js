'use strict'

// Load Modules
const express = require('express');
const { subcategoryCtrl } = require('../../controllers');

var api = express.Router();

// Routes and controllers
api.get('/select_options', subcategoryCtrl.getSubcategoryOptions); //Opciones para el Selector
api.get('/last', subcategoryCtrl.getLastSubcategories);
api.get('/', subcategoryCtrl.getSubcategories);
api.post('/', subcategoryCtrl.createSubcategory);
api.put('/:id_subcategory', subcategoryCtrl.updateSubcategory);
api.delete('/:id_subcategory', subcategoryCtrl.deleteSubcategory);
//api.get('/count', categoryController.countCategory);

module.exports = api;