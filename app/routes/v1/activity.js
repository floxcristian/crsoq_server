'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const express = require('express');
const _activityController = require('../../controllers')._activity;
const _validation = require('../../validations/calendar.validation');
const _validate = require('../../middlewares/validation-result');

var api = express.Router();

// Routes and controllers
api.get('/', _activityController.getActivities);
api.get('/students', _activityController.getStudentsByActivityID);
// api.get('/:userId', colorController.getColorsByUserId);
api.post('/', _activityController.createActivity);
api.put('/:activityId', _activityController.updateActivity);
api.delete('/:activityId', _activityController.deleteActivity);
//api.get('/count', _activityController.countActivity);

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = api;