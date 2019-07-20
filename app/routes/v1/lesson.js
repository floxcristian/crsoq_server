'use strict'

// Load modules
const express = require('express');
const { classCtrl } = require('../../controllers');
//const _validation = require('../../validations/calendar.validation');
//const _validate = require('../../middlewares/validation-result');

var api = express.Router();

//api.get('/enter_to_question_room');
//api.get('enter_to_questuib');
// Routes and controllers
api.get('/select_options', classCtrl.getLessonOptions); //Opciones de selector
api.get('/:id_class', classCtrl.getClassById);
api.get('/', classCtrl.getLessons);
api.post('/', classCtrl.createLesson);
api.put('/:id_class', classCtrl.updateLesson);
api.delete('/:id_class', classCtrl.deleteLesson);

module.exports = api;