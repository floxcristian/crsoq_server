'use strict'

// Load modules
const express = require('express');
const file_upload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const pool = require('../../database');

const app = express();

app.use(file_upload());

// example: 'uploads/images/questions/1542488957846.jpg'
//> Necesario??
app.get('/uploads/images', (req, res) => {

})

// Upload an image file
// example: 'upload/users', 'upload/questions'
app.put('/upload/:file_type/:id_file_type', (req, res, next) => {

    try {
        const {
            file_type,
            id_file_type
        } = req.params;

        if (!req.files) {
            return res.status(400).json({
                message: 'no se ha seleccionado ningún archivo'
            });
        }

        const valid_file_types = ['users', 'questions'];
        const valid_file_extensions = ['png', 'jpg', 'gif', 'jpeg'];

        // Responde con error si el tipo de imagen no es válido
        if (valid_file_types.indexOf(file_type) < 0) {
            return res.status(400).json({
                message: `the allowed file types are ${valid_file_types.join(', ')} and your file type is ${file_type}.`
            });
        }

        let { file } = req.files; // Obtiene el archivo de imagen
        let file_separation = file.name.split('.'); // Separa la extensión del nombre
        let file_extension = file_separation[file_separation.length - 1]; // Obtiene la extensión del archivo
        // Responde con error si la extensión no es soportada
        if (valid_file_extensions.indexOf(file_extension) < 0) {
            return res.status(400).json({
                message: `the allowed file extensions are ${valid_file_extensions.join(', ')} and your file extesion is ${file_extension}.`
            });
        }

        // Cambia el nombre del archivo evitando que se repita con el de otra imagen
        let file_name = `${id_file_type}-${new Date().getMilliseconds()}.${file_extension}`;

        // Guarda el archivo
        file.mv(`uploads/${file_type}/${file_name}`, (error) => {
            if (error) {
                return res.status(500).json({
                    error
                });
            }
            
            // Responde en base al tipo de imagen 
            if (file_type == 'users') userImage(id_file_type, res, file_name);
            else if(file_type == 'questions') questionImage(id_file_type, res, file_name);
        });

    } catch (error) {
        next({
            error
        });
    }

});

// Actualiza la imagen del usuario
const userImage = async (id_user, res, file_name) => {
    try {
        // Verifica si el usuario existe
        const text = `
            SELECT id_user 
            FROM users 
            WHERE id_user = $1`;
        const values = [id_user];
        const {
            rows
        } = await pool.query(text, values);

        // Borra el archivo si no existe el usuario
        if (rows.length == 0) {
            deleteFile(file_name, 'users');
            return res.status(400).json({
                message: `user ${id_user} does not exists`
            });
        }

        // Elimina la imagen antigua del usuario
        deleteFile(rows[0].profile_image, 'users');
        // Actualiza la nueva imagen
        const text2 = `
            UPDATE users 
            SET profile_image = $1 
            WHERE id_user = $2`;
        const values2 = [file_name, id_user];
        await pool.query(text2, values2);
        res.json();

    } catch (error) {
        next({
            error
        });
    }
}

// Actualiza la imagen de la pregunta
const questionImage = async (id_question, res, file_name) => {
    try {
        // Verifica si la pregunta existe
        const text = `
            SELECT id_question 
            FROM questions 
            WHERE id_question = $1`;
        const values = [id_question];
        const {
            rows
        } = await pool.query(text, values);

        // Borra el archivo si no existe la pregunta
        if (rows.length == 0) {
            deleteFile(file_name, 'questions');
            return res.status(400).json({
                message: `question ${id_question} does not exists`
            });
        }

        // Elimina la imagen antigua de la pregunta
        deleteFile(rows[0].image, 'questions');
        // Actualiza la nueva imagen
        const text2 = `
            UPDATE questions 
            SET image = $1 
            WHERE id_question = $2`;
        const values2 = [file_name, id_question];
        await pool.query(text2, values2);
        res.json();

    } catch (error) {
        next({
            error
        });
    }
}

// Elimina un archivo del servidor
const deleteFile = (image_name, file_type) => {
    // Obtiene el path de la imagen en el servidor
    const image_path = path.resolve(__dirname, `../../../uploads/${file_type}/${image_name}`);
    //
    if (fs.existsSync(image_path)) fs.unlinkSync(image_path)
}

module.exports = app;