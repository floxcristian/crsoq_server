'use strict'

// Load modules
const express = require('express');
const { moduleCtrl }  = require('../../controllers');

var api = express.Router();

// Routes and controllers
api.get('/', moduleCtrl.getModules);
api.get('/select_options', moduleCtrl.getModuleOptions); //Opciones para el Selector
api.post('/', moduleCtrl.createModule);
api.put('/:id_module', moduleCtrl.updateModule); 
api.delete('/:id_module', moduleCtrl.deleteModule); 
// api.get('/count', calendarController.countCalendar);

module.exports = api;