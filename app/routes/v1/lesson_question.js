'use strict'

// Load modules
const express = require('express');
const _lessonQuestionController = require('../../controllers')._lessonQuestion;

var api = express.Router();

// Routes and controllers
api.get('/', _lessonQuestionController.getLessonQuestions);
api.get('/all', _lessonQuestionController.getAllQuestionsForLesson);
api.get('/course_questions', _lessonQuestionController.getCourseQuestions);
api.get('/course/:id_course', _lessonQuestionController.getQuestionByCourse);
//api.get('/select_options', _questionController.getQuestionOptions); //Opciones para el Selector
//api.get('/:userId', colorController.getColorsByUserId);
api.post('/', _lessonQuestionController.updateLessonQuestions); // Agrega varias preguntas a la biblioteca
api.post('/:id_class/:id_question', _lessonQuestionController.updateLessonQuestion); // Actualiza una pregunta
//api.put('/:questionId', _questionController.updateQuestion);
api.delete('/:id_class/:id_question', _lessonQuestionController.deleteClassQuestion);
//api.get('/count', categoryController.countCategory);

module.exports = api;