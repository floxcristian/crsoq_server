'use strict'

// Load modules
const express = require('express');
const { userCtrl } = require('../../controllers');
const { checkToken } = require('../../middlewares/authenticated');
var api = express.Router();

// Routes and controllers
//api.get('/:page?', checkToken, userCtrl.getUsers);
api.get('/students', userCtrl.getUsersStudents);
api.get('/count', userCtrl.countUser);

api.get('/', userCtrl.getUsers);
api.get('/:id_user', userCtrl.getUserByUserId);
api.post('/', userCtrl.createUser);
api.put('/:id_user', userCtrl.updateUser);
api.delete('/:id_user', userCtrl.deleteUser);

module.exports = api;