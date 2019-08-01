'use strict'

// Load modules
const express = require('express');
const { userQuestionClassCtrl } = require('../../controllers');

var api = express.Router();

// Routes and controllers
api.get('/', userQuestionClassCtrl.getParticipants);

module.exports = api;