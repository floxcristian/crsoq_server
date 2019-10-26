'use strict'

// Load modules
const userCtrl = require('./user');
const userQuestionClassCtrl = require('./user_question_class');
const colorCtrl = require('./color');
const calendarCtrl = require('./calendar');
const categoryCtrl = require('./category');
const subcategoryCtrl = require('./subcategory');
const authCtrl = require('./auth');
const subjectCtrl = require('./subject');
const courseCtrl = require('./course');
const questionCtrl = require('./question');
const moduleCtrl = require('./module');
const enrollmentCtrl = require('./enrollment');
const classCtrl = require('./lesson');
const classQuestionCtrl = require('./lesson_question');
const activityCtrl = require('./activity');
const activityParticipationCtrl = require('./activity_participation');
const imageCtrl = require('./image');
const workspaceCtrl = require('./workspace');
const statisticsCtrl = require('./statistics');
const filesCtrl = require('./files');

module.exports = {
    activityCtrl,
    activityParticipationCtrl,
    userCtrl,
    colorCtrl,
    calendarCtrl,
    categoryCtrl,
    subcategoryCtrl,
    courseCtrl,
    authCtrl,
    subjectCtrl,
    questionCtrl,
    statisticsCtrl,
    moduleCtrl,
    classCtrl,
    classQuestionCtrl,
    enrollmentCtrl,
    imageCtrl,
    workspaceCtrl,
    userQuestionClassCtrl,
    filesCtrl
};