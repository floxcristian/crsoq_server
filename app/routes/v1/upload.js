const express = require('express');
const file_upload = require('express-fileupload');
const app = express();
const pool = require('../../database');
const fs = require('fs');
const path = require('path');

//DEFAULT OPTIONS
app.use(file_upload());

//uploads/images/questions/1542488957846.jpg
app.get('/uploads/images', (req, res) => {
 
})

app.put('/upload/:fileType/:id', (req, res) => {

    let file_type = req.params.fileType; //users /questions
    let id_file_type = req.params.id;
    if (!req.files) {
        return res.status(400).json({
            message: 'no se ha seleccionado ningún archivo'
        })
    }

    //VERIFICA SI ES UNA RUTA VÁLIDA PARA SUBIR IMAGEN
    let valid_file_types = ['users', 'questions'];
    if (valid_file_types.indexOf(file_type) < 0) {
        return res.status(400).json({
            success: false,
            message: `the allowed file types are ${valid_file_types.join(', ')} but your file type is ${file_type}`
        })
    }

    //OBTIENE LA EXTENSIÓN DEL ARCHIVO
    let file = req.files.file;
    let file_separation = file.name.split('.');
    let file_extension = file_separation[file_separation.length - 1];
    let valid_file_extensions = ['png', 'jpg', 'gif', 'jpeg'];

    //ENVIA ERROR SI LA EXTENSIÓN NO ES SOPORTADA
    if (valid_file_extensions.indexOf(file_extension) < 0) {
        return res.status(400).json({
            success: false,
            message: `the allowed file extensions are ${valid_file_extensions.join(', ')} but your file extesion is ${file_extension}`
        })
    }

    // CAMBIAR NOMBRE DEL ARCHIVO
    let file_name = `${id_file_type}-${new Date().getMilliseconds()}.${file_extension}`

    //GUARDAR EL ARCHIVO
    file.mv(`uploads/${file_type}/${file_name}`, (error) => {
        if (error) {
            return res.status(500).json({
                error
            })
        }

        //CONSULTAR SI EXISTE EL ID
        if(file_type == 'users'){
            userImage(id_file_type, res, file_name);
        }
        else{
            questionImage(id_file_type, res, file_name);
        }
        
    })
});

async function userImage(id_user, res, file_name) {
    try {
        //CONSULTA SI EXISTE EL USUARIO
        const rows_search = (await pool.query('SELECT * FROM users WHERE id_user = $1', [id_user])).rows;

        //SI NO EXISTE BORRA EL ARCHIVO
        if (rows_search.length == 0) {
            deleteFile(file_name, 'users')
            return res.status(400).json({
                message: `user ${id_user} does not exists`
            })
        }

        //SI EXISTE BORRA LA IMAGEN ANTERIOR
        deleteFile(rows_search[0].profile_image, 'users')
        const result = (await pool.query('UPDATE users SET profile_image = $1 WHERE id_user = $2', [file_name, id_user])).rows;
        res.json({
            message: 'imagen cargada en db correctamente'
        })

    } catch (error) {
        next({ error });
    }
}

async function questionImage(id_question, res, file_name){
    try {
        const rows_search = (await pool.query('SELECT * FROM questions WHERE id_question = $1', [id_question])).rows;

        if (rows_search.length == 0) {
            deleteFile(file_name, 'questions')
            return res.status(400).json({
                success: false,
                message: `question ${id_question} does not exists`
            })
        }
        deleteFile(rows_search[0].image, 'questions')
        const result = (await pool.query('UPDATE questions SET image = $1 WHERE id_question = $2', [file_name, id_question])).rows;
        res.json({
            message: 'imagen cargada en db correctamente'
        })

    } catch (error) {
        next({ error });
    }
}


function deleteFile(image_name, file_type) {
    let image_path = path.resolve(__dirname, `../../../uploads/${file_type}/${image_name}`);
    if (fs.existsSync(image_path)) {
        fs.unlinkSync(image_path)
    }
}



module.exports = app;