"use strict";

// Load modules
const express = require("express");
const { colorCtrl } = require("../../controllers");

var api = express.Router();

// Routes and controllers
api
  .get("/", colorCtrl.getColors)
  .get("/:id_user", colorCtrl.getColorsByUserId)
  .post("/create", colorCtrl.createColor)
  .put("/update/:id_color", colorCtrl.updateColor)
  .delete("/delete/:id_color", colorCtrl.deleteColor)
//api.get('/:userId/:page?', colorCtrl.getColorsByUserId);

module.exports = api;
