'use strict'

// Load modules
const express = require('express'),
    auth = require('./auth'),
    colors = require('./color'),
    users = require('./user'),
    subjects = require('./subject'),
    calendars = require('./calendar'),
    categories = require('./category'),
    subcategories = require('./subcategory'),
    courses = require('./course'),
    questions = require('./question'),
    modules = require('./module'),
    enrollments = require('./enrollment'),
    workspaces = require('./workspace'),
    lessons = require('./lesson'),
    lessonQuestions = require('./lesson_question'),
    activities = require('./activity'),
    activityParticipation = require('./activity_participation'),
    images = require('./image'),
    user_question_class = require('./user_question_class'),
    statistics = require('./statistics'),
    files = require('./files');


// Define la app express
const app = express();

// Define middlewares de las rutas
app
    .use(auth)
    .use('/colors', colors)
    .use('/users', users)
    .use('/user_question_class', user_question_class)
    .use('/subjects', subjects)
    .use('/calendars', calendars)
    .use('/categories', categories)
    .use('/subcategories', subcategories)
    .use('/courses', courses)
    .use('/questions', questions)
    .use('/modules', modules)
    .use('/enrollments', enrollments)
    .use('/workspaces', workspaces)
    .use('/lessons', lessons)
    .use('/lesson_questions', lessonQuestions)
    .use('/activities', activities)
    .use('/activity_participation', activityParticipation)
    .use('/statistics', statistics)
    .use('/uploads', images)
    .use('/files', files)

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






