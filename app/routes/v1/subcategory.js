"use strict";

// Load Modules
const express = require("express");
const { subcategoryCtrl } = require("../../controllers");

var api = express.Router();

// Routes and controllers
api
  .get("/select_options", subcategoryCtrl.getSubcategoryOptions) //Opciones para el Selector
  .get("/last", subcategoryCtrl.getLastSubcategories)
  .get("/", subcategoryCtrl.getSubcategories)
  .post("/", subcategoryCtrl.createSubcategory)
  .put("/:id_subcategory", subcategoryCtrl.updateSubcategory)
  .delete("/:id_subcategory", subcategoryCtrl.deleteSubcategory);
//api.get('/count', categoryController.countCategory);

module.exports = api;
