'use strict'

// Load modules
const express = require('express');
const { activityParticipationCtrl } = require('../../controllers');
//const _validation = require('../../validations/calendar.validation');
//const _validate = require('../../middlewares/validation-result');

//const router = express.Router();
const api = express.Router();

// Routes
api
    .post('/:id_activity', activityParticipationCtrl.updateActivityParticipations) // Agrega varias preguntas a la biblioteca
    .put('/:id_activity/:id_user', activityParticipationCtrl.updateActivityParticipation)
//.delete('/:lessonId', _lessonController.deleteLesson);

module.exports = api;