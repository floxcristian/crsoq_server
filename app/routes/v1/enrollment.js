"use strict";

// Load modules
const express = require("express");
const { enrollmentCtrl } = require("../../controllers");

var api = express.Router();

// Routes and controllers
//api.get('/', enrollmentCtrl.getEnrollments);
api
  .get("/courses/:id_course", enrollmentCtrl.getEnrollmentsByCourseId)
  .get("/users/:id_user", enrollmentCtrl.getEnrollmentsByUserId)
  .post("/", enrollmentCtrl.createEnrollment)
  .put("/:id_course/:id_user", enrollmentCtrl.updateEnrollment)
  .delete("/:id_course/:id_user", enrollmentCtrl.deleteEnrollment)
//api.get('/count', calendarController.countCalendar);

module.exports = api;
