'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const PrettyError = require('pretty-error');
const pe = new PrettyError();

// ----------------------------------------
// Init Pretty Error Configuration
// ----------------------------------------
(() => {
    pe.skipNodeFiles();
    pe.skipPackage('express');
    pe.skipPath('internal/process/next_tick.js')
    pe.skipPath('bootstrap_node.js')
})()

// ----------------------------------------
// Clean Stack Trace
// ----------------------------------------
function cleanStack(stack) {
    return stack.split(/\n/)
        .map(stackTrace => stackTrace.replace(/\s{2,}/g, ' ').trim())
}

// ----------------------------------------
// Log Errors:
// + Send Logs only during Development.
//----------------------------------------
function logErrors(error, req, res, next) {
    if (process.env.NODE_ENV === 'development') console.log(error) //console.log(pe.render(error.error)); 
    next(error);
}

// ----------------------------------------
// HTTP Error Handler:
// + Send Stacktrace only during Development.
// ----------------------------------------
function handler(error, req, res, next) {
    res.status(error.status || 500);
    res.json({
        message: error.message ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? cleanStack(error.error.stack) : undefined,
    });
}

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {
    logErrors,
    handler
};