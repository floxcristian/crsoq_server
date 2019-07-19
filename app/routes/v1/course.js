'use strict'

// Load modules
const express = require('express');
const courseController = require('../../controllers').course;

var api = express.Router();

// Routes and controllers
api.get('/', courseController.getCourses);
api.get('/search', courseController.getCoursesBy);
api.get('/:id_course', courseController.getCourseDetail);
api.get('/select_options', courseController.getCourseOptions); //Opciones para el Selector
api.post('/', courseController.createCourse);
api.put('/:id_course', courseController.updateCourse);
api.delete('/:id_course', courseController.deleteCourse);
// api.get('/count', calendarController.countCalendar);

module.exports = api;