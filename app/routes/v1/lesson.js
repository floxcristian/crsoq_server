"use strict";

// Load modules
const express = require("express");
const { classCtrl } = require("../../controllers");
//const _validation = require('../../validations/calendar.validation');
//const _validate = require('../../middlewares/validation-result');

var api = express.Router();

//api.get('/enter_to_question_room');
//api.get('enter_to_questuib');
// Routes and controllers
api
  .get("/select_options", classCtrl.getLessonOptions) //Opciones de selector
  .get("/:id_class", classCtrl.getClassById)
  .get("/", classCtrl.getLessons)
  .post("/", classCtrl.createLesson)
  .put("/:id_class", classCtrl.updateLesson)
  .delete("/:id_class", classCtrl.deleteLesson);

module.exports = api;
