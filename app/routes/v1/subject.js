'use strict'

// Load modules
const express = require('express');
const { subjectCtrl } = require('../../controllers');
const { checkToken } = require('../../middlewares/authenticated');
var api = express.Router();

// Routes and controllers
api.get('/count', checkToken, subjectCtrl.countSubject);
api.get('/select_options', subjectCtrl.getSubjectOptions); //Opciones para el Selector
api.get('/', checkToken, subjectCtrl.getSubjects);
api.post('/', subjectCtrl.createSubject);
api.put('/:id_subject', subjectCtrl.updateSubject);
api.delete('/:id_subject', subjectCtrl.deleteSubject);

module.exports = api;