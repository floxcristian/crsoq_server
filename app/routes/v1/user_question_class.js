'use strict'

// Load modules
const express = require('express');
const { userQuestionClassCtrl } = require('../../controllers');

var api = express.Router();

// Routes and controllers
api.get('/', userQuestionClassCtrl.getStudents);
api.post('/winner_student', userQuestionClassCtrl.setWinnerStudent);
api.post('/loser_student', userQuestionClassCtrl.setLoserStudent);

module.exports = api;