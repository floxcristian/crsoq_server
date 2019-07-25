'use strict'

// Load modules
const express = require('express');
// Load routes
const auth = require('./auth');
const colors = require('./color');
const users = require('./user');
const subjects = require('./subject');
const calendars = require('./calendar');
const categories = require('./category');
const subcategories = require('./subcategory');
const courses = require('./course');
const questions = require('./question');
const modules = require('./module');
const enrollments = require('./enrollment');
const workspaces = require('./workspace');
const lessons = require('./lesson');
const lessonQuestions = require('./lesson_question');
const activities = require('./activity');
const activityParticipation = require('./activity_participation');
const images = require('./image');
const user_question_class = require('./user_question_class');

// Define la app express
const app = express();

// Definimos los middlewares de las rutas
app.use(auth);
app.use('/colors', colors);
app.use('/users', users);
app.use('/user_question_class', user_question_class);
app.use('/subjects', subjects);
app.use('/calendars', calendars);
app.use('/categories', categories);
app.use('/subcategories', subcategories);
app.use('/courses', courses);
app.use('/questions', questions);
app.use('/modules', modules);
app.use('/enrollments', enrollments);
app.use('/workspaces', workspaces);
app.use('/lessons', lessons);
app.use('/lesson_questions', lessonQuestions);
app.use('/activities', activities);
app.use('/activity_participation', activityParticipation);
app.use('/uploads', images);

// Server Status
app.get('/status', (req, res) => res.send('OK'));

// Documentation
//router.use('/docs', express.static('docs'));

module.exports = app;


//const file_upload = require('express-fileupload');
//app.use(file_upload());
// app.use(function(err,req,res,next) {
//     console.log(err.stack);
//     res.status(500).send({"Error" : err.stack});
//   });






