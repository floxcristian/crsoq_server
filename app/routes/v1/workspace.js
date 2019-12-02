"use strict";

// Load modules
const express = require("express");
const { workspaceCtrl } = require("../../controllers");

var api = express.Router();

// Routes and controllers
api
  .get("/", workspaceCtrl.getWorkspaces)
  .post("/", workspaceCtrl.updateWorkspaces)
//api.put('/:workspaceId', workspaceController.updateWorkspace);
//api.delete('/:workspaceId', workspaceController.deleteWorkspace);
//api.get('/count', calendarController.countCalendar);

module.exports = api;
