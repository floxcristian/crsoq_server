"use strict";

// Load modules
const express = require("express");
const { activityCtrl } = require("../../controllers");
const _validation = require("../../validations/calendar.validation");
const _validate = require("../../middlewares/validation-result");

var api = express.Router();

// Routes
api
  .get("/", activityCtrl.getActivities)
  .get("/students", activityCtrl.getStudentsByActivityID)
  // api.get('/:userId', colorController.getColorsByUserId);
  .post("/", activityCtrl.createActivity)
  .put("/:id_activity", activityCtrl.updateActivity)
  .delete("/:id_activity", activityCtrl.deleteActivity)
//api.get('/count', activityCtrl.countActivity);

module.exports = api;
