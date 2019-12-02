"use strict";

// Load modules
const express = require("express");
const { userCtrl } = require("../../controllers");
const { checkToken } = require("../../middlewares/authenticated");
var api = express.Router();

// Routes and controllers
//api.get('/:page?', checkToken, userCtrl.getUsers);
api
  .get("/students", userCtrl.getUsersStudents)
  .get("/count", userCtrl.countUser)

  .get("/", userCtrl.getUsers)
  .get("/:id_user", userCtrl.getUserByUserId)
  .post("/", userCtrl.createUser)
  .put("/:id_user", userCtrl.updateUser)
  .delete("/:id_user", userCtrl.deleteUser)

module.exports = api;
