'use strict'

// Load modules
const express = require('express');
const { courseCtrl } = require('../../controllers');

var api = express.Router();

// Routes and controllers
api.get('/', courseCtrl.getCourses);
api.get('/search', courseCtrl.getCoursesBy);
api.get('/:id_course', courseCtrl.getCourseDetail);
api.get('/select_options', courseCtrl.getCourseOptions); //Opciones para el Selector
api.post('/', courseCtrl.createCourse);
api.put('/:id_course', courseCtrl.updateCourse);
api.delete('/:id_course', courseCtrl.deleteCourse);
// api.get('/count', calendarController.countCalendar);

module.exports = api;