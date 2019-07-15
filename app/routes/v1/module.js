'use strict'

// Load Modules
const express = require('express');
const moduleController = require('../../controllers')._module;

var api = express.Router();

// Routes and Controllers
api.get('/', moduleController.getModules);
api.get('/select_options', moduleController.getModuleOptions); //Opciones para el Selector
api.post('/', moduleController.createModule);
api.put('/:moduleId', moduleController.updateModule); 
api.delete('/:moduleId', moduleController.deleteModule); 
// api.get('/count', calendarController.countCalendar);

// Export Modules
module.exports = api;