'use strict'

// Load modules
const express = require('express');
const { enrollmentCtrl } = require('../../controllers');

var api = express.Router();

// Routes and controllers
//api.get('/', enrollmentCtrl.getEnrollments);
api.get('/courses/:id_course', enrollmentCtrl.getEnrollmentsByCourseId);
api.get('/users/:id_user', enrollmentCtrl.getEnrollmentsByUserId);
api.post('/', enrollmentCtrl.createEnrollment);
api.put('/:id_course/:id_user', enrollmentCtrl.updateEnrollment);
api.delete('/:id_course/:id_user', enrollmentCtrl.deleteEnrollment);
//api.get('/count', calendarController.countCalendar);

module.exports = api;