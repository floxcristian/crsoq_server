'use strict'

// Load modules
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
api.put('/:id_activity', _activityController.updateActivity);
api.delete('/:id_activity', _activityController.deleteActivity);
//api.get('/count', _activityController.countActivity);

module.exports = api;