'use strict'

// Load modules
const express = require('express');
const { activityParticipationCtrl } = require('../../controllers');
//const _validation = require('../../validations/calendar.validation');
//const _validate = require('../../middlewares/validation-result');

var api = express.Router();

// Routes and controllers
api.post('/:id_activity', activityParticipationCtrl.updateActivityParticipations); // Agrega varias preguntas a la biblioteca
api.put('/:id_activity/:id_user', activityParticipationCtrl.updateActivityParticipation);
//api.delete('/:lessonId', _lessonController.deleteLesson);

module.exports = api;