'use strict'

// Load modules
const express = require('express');
const moduleController = require('../../controllers')._module;

var api = express.Router();

// Routes and controllers
api.get('/', moduleController.getModules);
api.get('/select_options', moduleController.getModuleOptions); //Opciones para el Selector
api.post('/', moduleController.createModule);
api.put('/:id_module', moduleController.updateModule); 
api.delete('/:id_module', moduleController.deleteModule); 
// api.get('/count', calendarController.countCalendar);

module.exports = api;