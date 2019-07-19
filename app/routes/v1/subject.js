'use strict'

// Load modules
const express = require('express');
const subjectController = require('../../controllers').subject;
const { checkToken } = require('../../middlewares/authenticated');
var api = express.Router();

// Routes and controllers
api.get('/count', checkToken, subjectController.countSubject);
api.get('/select_options', subjectController.getSubjectOptions); //Opciones para el Selector
api.get('/', checkToken, subjectController.getSubjects);
api.post('/', subjectController.createSubject);
api.put('/:id_subject', subjectController.updateSubject);
api.delete('/:id_subject', subjectController.deleteSubject);

module.exports = api;