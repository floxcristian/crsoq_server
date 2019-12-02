"use strict";

// Load modules
const express = require("express");
const { subjectCtrl } = require("../../controllers");
const { checkToken } = require("../../middlewares/authenticated");
var api = express.Router();

// Routes and controllers
api
  .get("/count", checkToken, subjectCtrl.countSubject)
  .get("/select_options", subjectCtrl.getSubjectOptions) //Opciones para el Selector
  .get("/", checkToken, subjectCtrl.getSubjects)
  .post("/", subjectCtrl.createSubject)
  .put("/:id_subject", subjectCtrl.updateSubject)
  .delete("/:id_subject", subjectCtrl.deleteSubject)

module.exports = api;
