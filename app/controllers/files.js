"use strict";

// Load modules
const pool = require("../database");
const Excel = require("exceljs");

// https://github.com/exceljs/exceljs/issues/339
// exceljs resources
// + https://repl.it/@vishwasc/ExcelJs-Example
// + https://codeday.me/es/qa/20190606/814569.html
// + http://mundrisoft.com/tech-bytes/protractor-add-data-in-excel-sheet-using-exceljs-in-node/
// + https://www.ngdevelop.tech/export-to-excel-in-angular-6/
// + https://github.com/exceljs/exceljs#styles
// + https://js.devexpress.com/Demos/WidgetsGallery/Demo/DataGrid/ExcelJS/Angular/Light/

// Worksheets support a property bucket to allow control over some features of the worksheet.
// + https://github.com/exceljs/exceljs#worksheet-properties
const WS_PROPERTIES = {
    tabColor: {
        argb: "FFD366"
    },
    outlineLevelCol: 0
};

// All properties that can affect the printing of a sheet are held in a pageSetup object on the sheet.
// + https://github.com/exceljs/exceljs#page-setup
const WS_PAGESETUP = {
    paperSize: 9,
    showGridLines: true
};

const WS_OPTIONS = {
    properties: WS_PROPERTIES,
    pageSetup: WS_PAGESETUP
};

const BORDER_PROPERTY = { style: "thin", color: { argb: "FFD366" } };

const BORDER_PROPERTIES = {
    top: BORDER_PROPERTY,
    left: BORDER_PROPERTY,
    bottom: BORDER_PROPERTY,
    right: BORDER_PROPERTY
};


// Obtiene todos los colores
const genWorkbook = async (req, res, next) => {
    try {
        const { id_course } = req.params; //id_course, name
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
};

const createExcelFile = async (req, response, next) => {
    try {
        let file_name = "sample.xlsx";
        // Create workbook
        const workbook = new Excel.Workbook();
        // Set workbook properties (https://github.com/exceljs/exceljs#set-workbook-properties)
        workbook.creator = "RuviClass";
        workbook.created = new Date();

        // Add a worksheet
        const worksheet = workbook.addWorksheet("points_per_student", WS_OPTIONS);

        // Set workbook properties for print
        worksheet.headerFooter.oddFooter = "&B&ICRSOQ";

        // Add title row
        worksheet.addRow(["title"]);
        // Fix: Put 'background color' and 'border color' on 'title'
        /*
            titleRow.font = { name: "Arial", family: 4, size: 16, bold: true };
            */
        worksheet.mergeCells("A1:F1");
        let title = worksheet.getCell("A1");

        title.alignment = {
            vertical: "middle",
            horizontal: "center"
        };
        title.font = {
            size: 16,
            bold: true
        };
        title.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "8268A6" } // hex string for argb
        };
        //title.border = BORDER_PROPERTIES;

        ['A1', 'A2', 'B2', 'B3', 'C2', 'C3', 'D2', 'D3', 'E2', 'E3', 'F2', 'E3'].map(key => {
            worksheet.getCell(key).border = BORDER_PROPERTIES
        });


        // Add a row by contiguous Array (assign to columns A, B & C)
        worksheet.addRow([3, "Sam", new Date()]); //dd-mm-yyyy h:mm
        worksheet.getCell("C3").numFmt = 'dd/mm/yyyy\\ h:mm:ss';
        //expect(cell.type).toEqual(Excel.ValueType.Date);
        // Add blank Row
        worksheet.addRow([], []);
        worksheet.addRow([]);
        // Add table
        worksheet.addTable({
            name: "MyTable",
            ref: "A4",
            headerRow: true,
            totalsRow: true,
            style: {
                theme: "TableStyleMedium12", // TableStyleMedium10 (rojo), TableStyleMedium12 (morado), TableStyleMedium9 (azul)
                showRowStripes: true
            },
            columns: [
                { name: "#" },
                { name: "Date", totalsRowLabel: "Totals:", filterButton: true },
                { name: "Nombre", totalsRowFunction: "sum", filterButton: false }
            ],
            rows: [[1, 70.1], [5, 70.6], [1, 70.1]]
        });

        /*
            worksheet.getColumn()
            worksheet.eachRow((row, rowNumber) => {
                console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
              });
            */

        // Add an array of rows
        // Add row using key mapping to columns
        worksheet.addRow(
            ["FGH", "Author Name 4"], // OK
            { package_name: "XYZ", author_name: "Author 2" } // NO: Por qué no funciona el key mapping
        );

        //Add row with current date
        // Fix: put 'bold: true' on 'Asignatura', 'Curso' and 'Código Curso'.
        //let subTitleRow = worksheet.addRow({id: 1, name: 'John Doe', dob: new Date(1970,1,1)});

        worksheet.getRow(1).font = {
            color: { argb: "ffffff" },
            size: 12,
            bold: true
        };

        response.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        response.setHeader(
            "Content-Disposition",
            "attachment; filename=" + file_name
        );

        // save workbook to disk
        await workbook.xlsx.write(response);
        //return response;
        next();
        //response.send();
    } catch (error) {
        console.log("errorcito: ", error);
    }
};

const formatTitleCell = () => { };

module.exports = {
    genWorkbook,
    createExcelFile
};