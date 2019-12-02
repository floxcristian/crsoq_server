"use strict";

// Load modules
const express = require("express");
const { authCtrl } = require("../../controllers");
const validation = require("../../validations/auth.validation");
const { checkToken } = require("../../middlewares/authenticated");
const validate = require("../../middlewares/validation-result");

var api = express.Router();

// Routes
//api.post('/login', validation.login, validate.checkResult, authController.login);
api
  .post("/login", validation.login, authCtrl.login)
  .post("/update_session", checkToken, authCtrl.updateSession)
  .post("/renew_token", checkToken, authCtrl.renewToken)
//api.post('/reject_refresh_token', authController)
//api.post('/signup', );
//api.post('/forgot', );
//api.post('/reset', );

module.exports = api;

/** Ejemplo para documentación jsdoc
 * @api {post} v1/auth/refresh-token Refresh Token
 * @apiDescription Refresh expired accessToken
 * @apiVersion 1.0.0
 * @apiName RefreshToken
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  email         User's email
 * @apiParam  {String}  refreshToken  Refresh token aquired when user logged in
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 * @apiSuccess {String}  accessToken   Authorization Token
 * @apiSuccess {String}  refreshToken  Token to get a new accessToken after expiration time
 * @apiSuccess {Number}  expiresIn     Access Token's expiration time in miliseconds
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email or refreshToken
 */
// router.route('/refresh-token')
//   .post(validate(refresh), controller.refresh);
