'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const express = require('express');
const courseController = require('../../controllers').course;

var api = express.Router();

// ----------------------------------------
// Routes and Controllers
// ----------------------------------------
api.get('/', courseController.getCourses);
api.get('/search', courseController.getCoursesBy);
api.get('/:courseId', courseController.getCourseDetail);
api.get('/select_options', courseController.getCourseOptions); //Opciones para el Selector
api.post('/', courseController.createCourse);
api.put('/:courseId', courseController.updateCourse);
api.delete('/:courseId', courseController.deleteCourse);
// api.get('/count', calendarController.countCalendar);

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = api;