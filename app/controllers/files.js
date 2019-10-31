'use strict'

// Load modules
const pool = require('../database');
const Excel = require('exceljs');

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
// exceljs resources
// + https://repl.it/@vishwasc/ExcelJs-Example
// + https://codeday.me/es/qa/20190606/814569.html
// + http://mundrisoft.com/tech-bytes/protractor-add-data-in-excel-sheet-using-exceljs-in-node/
// + https://js.devexpress.com/Demos/WidgetsGallery/Demo/DataGrid/ExcelJS/Angular/Light/

// Obtiene todos los colores
const genWorkbook = async (req, res, next) => {
    try {

        const { id_course } = req.params;
        console.log("[genWorkbook] id_course: ", id_course);

        res = await createExcelFile(`sample.${EXCEL_EXTENSION}`, res);

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
        workbook.creator = 'RuviClass';
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

        // > Fix: Put 'background color' and 'border color' on 'title'
        titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

        // Add blank Row
        worksheet.addRow([], []);
        worksheet.addRow([]);

        // Add row with current date
        // > Fix: put 'bold: true' on 'Asignatura', 'Curso' and 'Código Curso'.
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
        // >

        // > Rcorrer todo el worksheet y aplicar estilo usando objectAssifn
        worksheet.getColumn(1).eachCell((cell, rowNumber) => {
            cell.font = { name: 'Arial', family: 4, size: 16, bold: true };
        })
        response.setHeader('Content-Type', EXCEL_TYPE);
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