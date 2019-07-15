'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const PrettyError = require('pretty-error');

// ----------------------------------------
// Init Pretty Error
// ----------------------------------------
(() => {
    let pe = new PrettyError();
    pError(pe)

    pe.skipNodeFiles();
    pe.skipPackage('express');
    pe.skipPath('internal/process/next_tick.js')
    pe.skipPath('bootstrap_node.js')
})

// ----------------------------------------
// Show Error Function
// ----------------------------------------
function pError(error) {
    console.log(pe.render(error));
}

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = pError;