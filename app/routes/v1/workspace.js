'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const express = require('express');
const workspaceController = require('../../controllers')._workspace;

var api = express.Router();

// ----------------------------------------
// Routes and Controllers
// ----------------------------------------
api.get('/', workspaceController.getWorkspaces);
api.post('/', workspaceController.updateWorkspaces);
//api.put('/:workspaceId', workspaceController.updateWorkspace);
//api.delete('/:workspaceId', workspaceController.deleteWorkspace);
//api.get('/count', calendarController.countCalendar);

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = api;