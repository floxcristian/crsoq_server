"use strict";

// Load modules
const express = require("express");
const { userQuestionClassCtrl } = require("../../controllers");

var api = express.Router();

// Routes and controllers
api
  .get("/", userQuestionClassCtrl.getQuestionParticipation)
  .post(
    "/:id_question/:id_class",
    userQuestionClassCtrl.updateStudentsParticipation
  );

module.exports = api;
