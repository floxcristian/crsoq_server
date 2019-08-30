'use strict'

// Load modules
const express = require('express');
const { courseCtrl } = require('../../controllers');

var api = express.Router();

// Routes and controllers
api
    .get('/', courseCtrl.getCourses)
    .get('/last_records', courseCtrl.getLatestUpdatedCourses)
    .get('/search', courseCtrl.getCoursesBy)
    .get('/:id_course', courseCtrl.getCourseDetail)
    .get('/select_options', courseCtrl.getCourseOptions) //Opciones para el Selector
    .post('/', courseCtrl.createCourse)
    .put('/:id_course', courseCtrl.updateCourse)
    .delete('/:id_course', courseCtrl.deleteCourse)
// api.get('/count', calendarController.countCalendar);

module.exports = api;