'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// ----------------------------------------
// Set Storage Configuration
// ----------------------------------------
function storageUpload(_storageDest) {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, _storageDest)
        },
        filename: function (req, file, cb) {
            cb(null, (Date.now()).toString() + path.extname(file.originalname));
        }
    });
}

// ----------------------------------------
// Set File Extensions Configuration
// + Fix new Error(). Send readable error!
// ----------------------------------------
function filterUpload(_extsAllowed) {
    return function (req, file, cb) {
        if (_extsAllowed.includes(file.mimeType)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    };
}

// ----------------------------------------
// Upload File Function
// ----------------------------------------
function uploadFile(_storageDest, _extsAllowed, _fileSize, _fieldName) {
    return multer({
        storage: storageUpload(`uploads/${_storageDest}`),
        limits: {
            fileSize: 1024 * 1024 * _fileSize
        },
        fileFilter: filterUpload(_extsAllowed)
    }).single(_fieldName);
}

// ----------------------------------------
// Delete File Function
// ----------------------------------------
function deleteFile(file_path) {
    let global_path = path.resolve(__dirname, `../../${file_path}`);
    if (fs.existsSync(global_path)) fs.unlinkSync(global_path)
}

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {
    uploadFile,
    deleteFile
}