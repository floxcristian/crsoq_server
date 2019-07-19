'use strict'

// Load modules
const express = require('express');
const colorController = require('../../controllers').color;

var api = express.Router();

// Routes and controllers
api.get('/', colorController.getColors);
api.get('/:id_user', colorController.getColorsByUserId);
api.post('/create', colorController.createColor);
api.put('/update/:id_color', colorController.updateColor);
api.delete('/delete/:id_color', colorController.deleteColor);
//api.get('/:userId/:page?', colorController.getColorsByUserId);

module.exports = api;