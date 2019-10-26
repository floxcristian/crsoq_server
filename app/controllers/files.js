'use strict'

// Load modules
const pool = require('../database');
const Excel = require('exceljs');

// Obtiene todos los colores
const genWorkbook = async (req, res, next) => {
    try {

        const { id_course } = req.params;
        console.log("[genWorkbook] id_course: ", id_course);

        res = await createExcelFile("sample.xlsx", res);

        setTimeout(() => {
            console.log("res: ", res);
        }, 5000);


        /*const text = `
            SELECT id_color, name, hexadecimal 
            FROM colors 
            ORDER BY name ASC`;
        const {
            rows
        } = await pool.query(text);*/
        //res.send()
    } catch (error) {
        next({ error });
    }
}


const createExcelFile = async (file_path, response) => {

    try {
        // Create workbook
        const workbook = new Excel.Workbook();
        // Set workbook properties
        //<
        workbook.creator = 'CRSOQ v1';
        workbook.created = new Date();
        //>

        // Add worksheet
        const worksheet = workbook.addWorksheet('points_per_student', {
            properties: {
                tabColor: {
                    argb: 'FFD366'
                },
                outlineLevelCol: 0
            },
            pageSetup: {
                paperSize: 9,
                showGridLines: true
            }
        });

        // Set workbook properties for print

        worksheet.headerFooter.oddFooter = "&B&ICRSOQ";
        // Add row using key mapping to columns
        // Add title row
        let titleRow = worksheet.addRow(["title"]);
        
        titleRow.font = { name: 'Comic Sans MS', family: 4, size: 16, underline: 'double', bold: true };
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

        // Add blank Row
        worksheet.addRow([], []);
        worksheet.addRow([]);

        //Add row with current date
        let subTitleRow = worksheet.addRow(['Asignatura: ', 'xxx', 'Curso: ', 'xxx', 'Código Curso:', 'xxx']);
        /*
        // Add column headers
        worksheet.columns = [
            { header: 'Package', key: 'package_name', width: 15 },
            { header: 'Author', key: 'author_name', width: 15, outlineLevel: 2 }
        ];

        // Add row using key mapping to columns
        worksheet.addRow(
            { package_name: "ABC", author_name: "Author 1" },
            { package_name: "XYZ", author_name: "Author 2" }
        );

        // Add rows as Array values
        worksheet
            .addRow(["BCD", "Author Name 3"]);

        // Add rows using both the above of rows
        const rows = [
            ["FGH", "Author Name 4"],
            { package_name: "PQR", author_name: "Author 5" }
        ];


        worksheet.addRows(rows);
        */
        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.setHeader("Content-Disposition", "attachment; filename=" + file_path);

        // save workbook to disk
        await workbook.xlsx.write(response);
        //return response;
        response.send();
    }
    catch (error) {
        console.log("errorcito: ", error);
    }
};

module.exports = {
    genWorkbook
}