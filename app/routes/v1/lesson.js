'use strict'

// Load modules
const express = require('express');
const _lessonController = require('../../controllers')._lesson;
//const _validation = require('../../validations/calendar.validation');
//const _validate = require('../../middlewares/validation-result');

var api = express.Router();

// Routes and controllers
//api.get('/enter_to_question_room');
//api.get('enter_to_questuib');
// Routes and controllers
api.get('/select_options', _lessonController.getLessonOptions); //Opciones de selector
api.get('/:classId', _lessonController.getClassById);
api.get('/', _lessonController.getLessons);
api.post('/', _lessonController.createLesson);
api.put('/:lessonId', _lessonController.updateLesson);
api.delete('/:lessonId', _lessonController.deleteLesson);

module.exports = api;