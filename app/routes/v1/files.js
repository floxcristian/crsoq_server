'use strict'

// Load modules
const express = require('express');
const { filesCtrl } = require('../../controllers');

var api = express.Router();

// Routes and controllers
api.get('/spreadsheet/:id_course', filesCtrl.genWorkbook)

module.exports = api;