"use strict";

// Load modules
const express = require("express");
const { classQuestionCtrl } = require("../../controllers");

var api = express.Router();

// Routes and controllers
api
  .get("/", classQuestionCtrl.getLessonQuestions)
  .get("/all", classQuestionCtrl.getAllQuestionsForLesson)
  .get("/course_questions", classQuestionCtrl.getCourseQuestions)
  .get("/student_summary", classQuestionCtrl.getSummaryStudentParticipation)
  .get("/course/:id_course", classQuestionCtrl.getQuestionByCourse)
  //api.get('/select_options', _questionController.getQuestionOptions); //Opciones para el Selector
  //api.get('/:userId', colorController.getColorsByUserId);
  .post("/", classQuestionCtrl.updateLessonQuestions) // Agrega varias preguntas a la biblioteca
  .post("/:id_class/:id_question", classQuestionCtrl.updateLessonQuestion) // Actualiza una pregunta
  //api.put('/:questionId', _questionController.updateQuestion);
  .delete("/:id_class/:id_question", classQuestionCtrl.deleteClassQuestion)
//api.get('/count', categoryController.countCategory);

module.exports = api;
