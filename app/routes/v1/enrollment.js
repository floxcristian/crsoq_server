'use strict'

// Load modules
const express = require('express');
const enrollmentController = require('../../controllers').enrollment;

var api = express.Router();

// Routes and controllers
//api.get('/', enrollmentController.getEnrollments);
api.get('/courses/:id_course', enrollmentController.getEnrollmentsByid_course);
api.get('/users/:id_user', enrollmentController.getEnrollmentsByUserId);
api.post('/', enrollmentController.createEnrollment);
api.put('/:id_course/:id_user', enrollmentController.updateEnrollment);
api.delete('/:id_course/:id_user', enrollmentController.deleteEnrollment);
//api.get('/count', calendarController.countCalendar);

module.exports = api;