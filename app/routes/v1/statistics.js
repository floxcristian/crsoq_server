'use strict'

// Load modules
const express = require('express');
const { statisticsCtrl } = require('../../controllers');

const api = express.Router();

// Routes and controllers
api.get('/course_student_points/:id_course', statisticsCtrl.courseStudentPoints)

module.exports = api;