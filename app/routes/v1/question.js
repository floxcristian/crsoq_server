'use strict'

// Load modules
const express = require('express');
const _questionController = require('../../controllers').question;

var api = express.Router();

// Routes and controllers
api.get('/', _questionController.getQuestions);
//api.get('/select_options', _questionController.getQuestionOptions); //Opciones para el Selector
//api.get('/:userId', colorController.getColorsByUserId);
api.post('/', _questionController.createQuestion); //arreglar
api.put('/:id_question', _questionController.updateQuestion);
api.delete('/:id_question', _questionController.deleteQuestion);
//api.get('/count', categoryController.countCategory);

module.exports = api;