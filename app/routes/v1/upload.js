'use strict'

// Load modules
const express = require('express');
const file_upload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const pool = require('../../database');

const app = express();
//DEFAULT OPTIONS
app.use(file_upload());

//uploads/images/questions/1542488957846.jpg
app.get('/uploads/images', (req, res) => {

})

// Sube una imágen
app.put('/upload/:file_type/:id_file_type', (req, res, next) => {

    const { file_type, id_file_type } = req.params; // users/questions
    if (!req.files) {
        return res.status(400).json({
            message: 'no se ha seleccionado ningún archivo'
        });
    }

    //VERIFICA SI ES UNA RUTA VÁLIDA PARA SUBIR IMAGEN
    let valid_file_types = ['users', 'questions'];
    if (valid_file_types.indexOf(file_type) < 0) {
        return res.status(400).json({
            message: `the allowed file types are ${valid_file_types.join(', ')} but your file type is ${file_type}`
        })
    }

    // Obtiene la extensión del archivo
    let file = req.files.file;
    let file_separation = file.name.split('.');
    let file_extension = file_separation[file_separation.length - 1];
    let valid_file_extensions = ['png', 'jpg', 'gif', 'jpeg'];

    //ENVIA ERROR SI LA EXTENSIÓN NO ES SOPORTADA
    if (valid_file_extensions.indexOf(file_extension) < 0) {
        return res.status(400).json({
            message: `the allowed file extensions are ${valid_file_extensions.join(', ')} but your file extesion is ${file_extension}`
        })
    }

    // Cambia el nombre del archivo
    let file_name = `${id_file_type}-${new Date().getMilliseconds()}.${file_extension}`

    //GUARDAR EL ARCHIVO
    file.mv(`uploads/${file_type}/${file_name}`, (error) => {
        if (error) {
            return res.status(500).json({
                error
            });
        }

        //CONSULTAR SI EXISTE EL ID
        if (file_type == 'users') {
            userImage(id_file_type, res, file_name);
        } else {
            questionImage(id_file_type, res, file_name);
        }

    })
});

const userImage = async (id_user, res, file_name) => {
    try {
        // Consulta si el usuario existe
        const text = `
            SELECT * 
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

        // Borra la imagen anterior si existe el usuario
        deleteFile(rows[0].profile_image, 'users')
        const text2 = `
            UPDATE users 
            SET profile_image = $1 
            WHERE id_user = $2`;
        const values2 = [file_name, id_user];
        await pool.query(text2, values2);
        res.json({
            message: 'imagen cargada en db correctamente'
        });

    } catch (error) {
        next({
            error
        });
    }
}

const questionImage = async (id_question, res, file_name) => {
    try {
        // Consulta si la pregunta existe
        const text = `
            SELECT * 
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

        //
        deleteFile(rows[0].image, 'questions');
        const text2 = `
            UPDATE questions 
            SET image = $1 
            WHERE id_question = $2`;
        const values2 = [file_name, id_question];
        await pool.query(text2, values2);
        res.json({
            message: 'imagen cargada en db correctamente'
        });

    } catch (error) {
        next({
            error
        });
    }
}


const deleteFile = (image_name, file_type) => {
    const image_path = path.resolve(__dirname, `../../../uploads/${file_type}/${image_name}`);
    if (fs.existsSync(image_path)) {
        fs.unlinkSync(image_path)
    }
}

module.exports = app;