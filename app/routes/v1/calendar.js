'use strict'

// Load modules
const express = require('express');
const calendarController = require('../../controllers').calendar;
const validation = require('../../validations/calendar.validation');
const validate = require('../../middlewares/validation-result');

var api = express.Router();

// Routes and controllers
api.get('/', calendarController.getCalendars);
api.get('/select_options', calendarController.getCalendarOptions); //Opciones para el Selector
api.post('/', validation.calendar, validate.checkResult, calendarController.createCalendar);
api.put('/:id_calendar', validation.calendar, validate.checkResult, calendarController.updateCalendar);
api.delete('/:id_calendar', calendarController.deleteCalendar);
api.get('/count', calendarController.countCalendar);

module.exports = api;


/** POST /api/users - Create new user */
//api.get('/', checkToken, subjectController.getSubjects);
//.post(validate(paramValidation.createUser), userCtrl.create);


/** PUT /api/users/:userId - Update user */
//.put(validate(paramValidation.updateUser), userCtrl.update