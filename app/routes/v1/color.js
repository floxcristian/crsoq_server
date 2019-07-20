'use strict'

// Load modules
const express = require('express');
const { colorCtrl } = require('../../controllers');

var api = express.Router();

// Routes and controllers
api.get('/', colorCtrl.getColors);
api.get('/:id_user', colorCtrl.getColorsByUserId);
api.post('/create', colorCtrl.createColor);
api.put('/update/:id_color', colorCtrl.updateColor);
api.delete('/delete/:id_color', colorCtrl.deleteColor);
//api.get('/:userId/:page?', colorCtrl.getColorsByUserId);

module.exports = api;