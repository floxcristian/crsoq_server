'use strict'

// Load modules
const express = require('express');
const { classQuestionCtrl } = require('../../controllers');

var api = express.Router();

// Routes and controllers
api.get('/', classQuestionCtrl.getLessonQuestions);
api.get('/all', classQuestionCtrl.getAllQuestionsForLesson);
api.get('/course_questions', classQuestionCtrl.getCourseQuestions);
api.get('/course/:id_course', classQuestionCtrl.getQuestionByCourse);
//api.get('/select_options', _questionController.getQuestionOptions); //Opciones para el Selector
//api.get('/:userId', colorController.getColorsByUserId);
api.post('/', classQuestionCtrl.updateLessonQuestions); // Agrega varias preguntas a la biblioteca
api.post('/:id_class/:id_question', classQuestionCtrl.updateLessonQuestion); // Actualiza una pregunta
//api.put('/:questionId', _questionController.updateQuestion);
api.delete('/:id_class/:id_question', classQuestionCtrl.deleteClassQuestion);
//api.get('/count', categoryController.countCategory);

module.exports = api;