'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const express = require('express');
const colorController = require('../../controllers').color;

var api = express.Router();

// ----------------------------------------
// Routes and Controllers
// ----------------------------------------
api.get('/', colorController.getColors);
api.get('/:userId', colorController.getColorsByUserId);
api.post('/create', colorController.createColor);
api.put('/update/:colorId', colorController.updateColor);
api.delete('/delete/:colorId', colorController.deleteColor);
//api.get('/:userId/:page?', colorController.getColorsByUserId);

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = api;