"use strict";

// Load modules
const express = require("express");
const { categoryCtrl } = require("../../controllers");

var api = express.Router();

// Routes and controllers
api
  .get("/select_options", categoryCtrl.getCategoryOptions) //Opciones para el Selector
  .get("/last", categoryCtrl.getLastCategories)
  .get("/", categoryCtrl.getCategories)
  .post("/", categoryCtrl.createCategory)
  .put("/:id_category", categoryCtrl.updateCategory)
  .delete("/:id_category", categoryCtrl.deleteCategory)
//api.get('/count', categoryCtrl.countCategory);

module.exports = api;
