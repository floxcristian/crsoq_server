'use strict'

// Load Modules
const express = require('express');
const subjectController = require('../../controllers').subject;
const { checkToken } = require('../../middlewares/authenticated');
var api = express.Router();

// Routes and Controllers
api.get('/count', checkToken, subjectController.countSubject);
api.get('/select_options', subjectController.getSubjectOptions); //Opciones para el Selector
api.get('/', checkToken, subjectController.getSubjects);
api.post('/', subjectController.createSubject);
api.put('/:subjectId', subjectController.updateSubject);
api.delete('/:subjectId', subjectController.deleteSubject);


// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = api;