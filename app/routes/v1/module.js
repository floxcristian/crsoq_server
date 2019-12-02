"use strict";

// Load modules
const express = require("express");
const { moduleCtrl } = require("../../controllers");

var api = express.Router();

// Routes and controllers
api
  .get("/", moduleCtrl.getModules)
  .get("/select_options", moduleCtrl.getModuleOptions) //Opciones para el Selector
  .post("/", moduleCtrl.createModule)
  .put("/:id_module", moduleCtrl.updateModule)
  .delete("/:id_module", moduleCtrl.deleteModule);
// api.get('/count', calendarController.countCalendar);

module.exports = api;
