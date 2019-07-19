'use strict'

// Load modules
const fs = require('fs');
const path = require('path');

// Get Roles
const getImages = async (req, res, next) => {

    try {
        const { category_type, image_file } = req.params;
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

module.exports = {
    getImages
}