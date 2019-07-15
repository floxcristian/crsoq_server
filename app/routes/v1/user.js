'use strict'

// Load Modules
const express = require('express');
const userController = require('../../controllers').user;
const { checkToken } = require('../../middlewares/authenticated');
var api = express.Router();

// Routes and Controllers
//api.get('/:page?', checkToken, userController.getUsers);
api.get('/students', userController.getUsersStudents);
api.get('/count', userController.countUser);

api.get('/', userController.getUsers);
api.get('/:userId', userController.getUserByUserId);
api.post('/', userController.createUser);
api.put('/:userId', userController.updateUser);
api.delete('/:userId', userController.deleteUser);



module.exports = api;