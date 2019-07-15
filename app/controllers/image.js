'use strict'

// ----------------------------------------
// Load Modules
// ----------------------------------------
const fs = require('fs');
const path = require('path');


// ----------------------------------------
// Get Roles
// ----------------------------------------
async function getImages(req, res, next) {
    try {
        const category_type = req.params.categoryType;
        const image_file = req.params.imageFile;
        let file_path = path.resolve(__dirname, `../..${req.originalUrl}`); //'uploads/images/questions/1542488957846.jpg};

        // Comprueba si existe la imagen
        if (!fs.existsSync(file_path)) {
            file_path = path.resolve(__dirname, '../assets/images/default_placeholder.png');
        }

        //res.sendFile(__dirname + '/index.html');
        //res.sendFile('index.html', { root: __dirname });
        res.sendFile(file_path);

    } catch (error) {
        next({ error });
    }
}

// ----------------------------------------
// Export Modules
// ----------------------------------------
module.exports = {
    getImages
}