'use strict'

// Load modules
const express = require('express');
const { questionCtrl } = require('../../controllers');

var api = express.Router();

// Routes and controllers
api.get('/', questionCtrl.getQuestions);
//api.get('/select_options', _questionController.getQuestionOptions); //Opciones para el Selector
//api.get('/:userId', colorController.getColorsByUserId);
api.post('/', questionCtrl.createQuestion); //arreglar
api.put('/:id_question', questionCtrl.updateQuestion);
api.delete('/:id_question', questionCtrl.deleteQuestion);
//api.get('/count', categoryController.countCategory);

module.exports = api;