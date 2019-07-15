'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const express = require('express');
const _questionController = require('../../controllers').question;

var api = express.Router();

// ----------------------------------------
// Routes and Controllers
// ----------------------------------------
api.get('/', _questionController.getQuestions);
//api.get('/select_options', _questionController.getQuestionOptions); //Opciones para el Selector
//api.get('/:userId', colorController.getColorsByUserId);
api.post('/', _questionController.createQuestion); //arreglar
api.put('/:questionId', _questionController.updateQuestion);
api.delete('/:questionId', _questionController.deleteQuestion);
//api.get('/count', categoryController.countCategory);

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = api;