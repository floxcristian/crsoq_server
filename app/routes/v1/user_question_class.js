'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const express = require('express');
const userQuestionClassController = require('../../controllers').user_question_class;
var api = express.Router();

// ----------------------------------------
// Routes and Controllers
// ----------------------------------------
api.get('/', userQuestionClassController.getStudents);
api.post('/winner_student', userQuestionClassController.setWinnerStudent);
api.post('/loser_student', userQuestionClassController.setLoserStudent);

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = api;