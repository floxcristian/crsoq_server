"use strict";

// Load modules
const express = require("express");
const { calendarCtrl } = require("../../controllers");
const validation = require("../../validations/calendar.validation");
const validate = require("../../middlewares/validation-result");

var api = express.Router();

// Routes and controllers
api
  .get("/", calendarCtrl.getCalendars)
  .get("/select_options", calendarCtrl.getCalendarOptions) //Opciones para el Selector
  .post(
    "/",
    validation.calendar,
    validate.checkResult,
    calendarCtrl.createCalendar
  )
  .put(
    "/:id_calendar",
    validation.calendar,
    validate.checkResult,
    calendarCtrl.updateCalendar
  )
  .delete("/:id_calendar", calendarCtrl.deleteCalendar)
  .get("/count", calendarCtrl.countCalendar)

module.exports = api;

/** POST /api/users - Create new user */
//api.get('/', checkToken, subjectController.getSubjects);
//.post(validate(paramValidation.createUser), userCtrl.create);

/** PUT /api/users/:userId - Update user */
//.put(validate(paramValidation.updateUser), userCtrl.update
