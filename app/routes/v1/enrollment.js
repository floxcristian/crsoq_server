'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const express = require('express');
const enrollmentController = require('../../controllers').enrollment;

var api = express.Router();

// ----------------------------------------
// Routes and Controllers
// ----------------------------------------
//api.get('/', enrollmentController.getEnrollments);
api.get('/courses/:courseId', enrollmentController.getEnrollmentsByCourseId);
api.get('/users/:userId', enrollmentController.getEnrollmentsByUserId);
api.post('/', enrollmentController.createEnrollment);
api.put('/:courseId/:userId', enrollmentController.updateEnrollment);
api.delete('/:courseId/:userId', enrollmentController.deleteEnrollment);
//api.get('/count', calendarController.countCalendar);

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = api;