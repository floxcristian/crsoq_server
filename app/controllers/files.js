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

const BORDER_PROPERTY = { style: "thin", color: { argb: "ffffff" } };

const BORDER_PROPERTIES = {
    top: BORDER_PROPERTY,
    left: BORDER_PROPERTY,
    bottom: BORDER_PROPERTY,
    right: BORDER_PROPERTY
};

const EXCEL_TYPE = 'application/vnd.openxmlformatsofficedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

const genWorkbook = async (req, res, next) => {
    try {
        const { id_course } = req.params; //id_course, name
        console.log("[genWorkbook] id_course: ", id_course);

        const text = `
            SELECT u.document, u.name, u.last_name, u.middle_name, t3.question_points, t3.activity_points
            FROM course_user AS cu
            INNER JOIN users AS u
            ON cu.id_user = u.id_user
            INNER JOIN (
              SELECT 
              CASE WHEN (t1.id_user > 0) THEN t1.id_user ELSE t2.id_user END AS id_user,
              CASE WHEN (t1.question_points > 0) THEN t1.question_points ELSE '0' END AS question_points,
              CASE WHEN (t2.activity_points > 0) THEN t2.activity_points ELSE '0' END AS activity_points
              FROM ( 
                SELECT uqc.id_user, count(uqc.id_user) AS question_points
                FROM modules AS m
                INNER JOIN classes AS c
                ON m.id_module = c.id_module
                INNER JOIN class_question AS cq
                ON c.id_class = cq.id_class
                INNER JOIN user_question_class AS uqc
                ON (cq.id_class = uqc.id_class AND cq.id_question = uqc.id_question)
                WHERE m.id_course = $1
                AND cq.status = 5
                AND uqc.status = 5
                GROUP BY uqc.id_user
              ) AS t1
              FULL JOIN (
                SELECT au.id_user, count(au.id_user) AS activity_points
                FROM modules AS m
                INNER JOIN classes AS c
                ON m.id_module = c.id_module
                INNER JOIN activities AS a
                ON c.id_class = a.id_class
                INNER JOIN activity_user AS au
                ON a.id_activity = au.id_activity
                WHERE m.id_course = $1
                AND a.status = 2
                AND au.status = 2
                GROUP BY au.id_user
              ) AS t2
              ON t1.id_user = t2.id_user
            ) AS t3
            ON u.id_user = t3.id_user
            WHERE cu.id_course = $1
            AND u.active = TRUE`;
        const values = [id_course];
        const { rows } = await pool.query(text, values);

        rows.forEach(item => {
            item.question_points = parseInt(item.question_points);
            item.activity_points = parseInt(item.activity_points);
            item.total = item.question_points + item.activity_points;
        });

        console.log("mario: ", rows);
        const text2 = `
        SELECT s.name AS subject, c.name AS course, c.code, c.course_goal, c.student_goal, ca.year, ca.semester
        FROM courses AS c
        INNER JOIN subjects AS s
        ON c.id_subject = s.id_subject
        INNER JOIN calendars AS ca
        ON c.id_calendar = c.id_calendar
        WHERE c.id_course = $1`;
        const values2 = [id_course];
        const info_data = (await pool.query(text2, values2)).rows[0];
        //console.log("repu: ", results);

        const result = { info: info_data, items: rows }
        //res.json(rows);

        res = await createExcelFile(result, res);

        // Enviar el archivo excel
        // res.sendFile(filePath);

        //res.send()
    } catch (error) {
        next({ error });
    }
};

const createExcelFile = async (data, response) => {
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

        const { subject, course, code, course_goal, student_goal, year, semester } = data.info;
        // Content rows
        worksheet.addRow(["Puntuación de Estudiantes"]);
        worksheet.addRow([]);
        worksheet.addRow(['Emisión', new Date().toLocaleString("en-US", { timeZone: 'America/Santiago' }), 'Asignatura', subject.toUpperCase(), 'Curso', course.toUpperCase()]); //dd-mm-yyyy h:mm
        worksheet.addRow(['Código Curso', code.toUpperCase(), 'Año', year, 'Semestre', semester]);
        worksheet.addRow(['Meta Curso', course_goal, 'Meta Estudiante', student_goal, '---', '---']);
        worksheet.addRow([]);

        worksheet.mergeCells("A1:F1");
        worksheet.mergeCells("A2:F2");
        worksheet.mergeCells("A6:F6");

        // Añade una tabla
        worksheet.addTable({
            name: "MyTable",
            ref: "A7",
            headerRow: true,
            totalsRow: true,
            style: {
                theme: "TableStyleMedium12", // TableStyleMedium10 (rojo), TableStyleMedium12 (morado), TableStyleMedium9 (azul)
                showRowStripes: true
            },
            columns: [
                { name: "#" },
                { name: "Nombre", totalsRowLabel: "Totals:", filterButton: true },
                { name: "Rut", filterButton: false },
                { name: "Pts. por Pregunta", totalsRowFunction: "sum", filterButton: true },
                { name: "Pts. por Actividad", totalsRowFunction: "sum", filterButton: true },
                { name: "Total", totalsRowFunction: "sum", filterButton: true }
            ],
            rows: gege(data.items)
        });


        // Obtiene las columnas utilizadas
        let col_a = worksheet.getColumn('A');
        let col_b = worksheet.getColumn('B');
        let col_c = worksheet.getColumn('C');
        let col_d = worksheet.getColumn('D');
        let col_e = worksheet.getColumn('E');
        let col_f = worksheet.getColumn('F');

        // Establece propiedades de cada columna
        col_a = Object.assign(col_a, { width: 25, alignment: { horizontal: 'center' } });
        col_b = Object.assign(col_b, { width: 35, alignment: { horizontal: 'left' } });
        col_c = Object.assign(col_c, { width: 35, alignment: { horizontal: 'left' } });
        col_d = Object.assign(col_d, { width: 25, alignment: { horizontal: 'center' } });
        col_e = Object.assign(col_e, { width: 25, alignment: { horizontal: 'center' } });
        col_f = Object.assign(col_f, { width: 25, alignment: { horizontal: 'center' } });

        // Establece bordes a las siguientes celdas
        ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B3', 'B4', 'B5', 'C3', 'C4', 'C5', 'D3', 'D4', 'D5', 'E3', 'E4', 'E5', 'F3', 'F4', 'F5'].map(key => {
            worksheet.getCell(key).border = BORDER_PROPERTIES;
        });

        const TITLE_CELLS = ['A1', 'A3', 'A4', 'A5', 'C3', 'C4', 'C5', 'E3', 'E4', 'E5'];
        const NOTITLE_CELLS = ['B3', 'B4', 'B5', 'D3', 'D4', 'D5', 'F3', 'F4', 'F5'];
        // Setea las celdas de título
        TITLE_CELLS.map(key => {
            worksheet.getCell(key).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "8268A6" }
            };
            worksheet.getCell(key).font = {
                color: { argb: "ffffff" },
                bold: true
            };
            worksheet.getCell(key).alignment = { horizontal: 'left' };
        });

        NOTITLE_CELLS.map(key => {
            worksheet.getCell(key).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "E4DFEC" }
            };
            worksheet.getCell(key).alignment = { horizontal: 'left' };
        });

        // Setea las celdas de separación
        ['A2', 'A6'].map(key => {
            worksheet.getCell(key).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "CCC0DA" }
            }
        });

        // Set date format to 'B3' cell
        worksheet.getCell('B3').numFmt = 'dd/mm/yyyy\\ h:mm:ss';

        let title = worksheet.getCell('A1');

        title.alignment = {
            vertical: "middle",
            horizontal: "center"
        };
        title.font = {
            size: 12,
            bold: true,
            color: { argb: "ffffff" }
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
        //await workbook.xlsx.write(response);

        workbook.xldx.writeBuffer()
            .then((data) => {
                let blob = new Blob([data], { type: EXCEL_TYPE });

            });
        //return response;

        //response.send();
    } catch (error) {
        console.log("errorcito: ", error);
    }
};


const gege = (data) => {

    let result = [];

    data.forEach((item, index) => {
        const { name, last_name, middle_name, document, question_points, activity_points, total } = item;
        result.push([index + 1, `${name} ${last_name} ${middle_name}`, document, question_points, activity_points, total])
    });
    console.log("result: ", result);
    return result;
}

const formatTitleCell = () => { };


const genExcel = async (req, res, next) => {

    try {
        const { id_course } = req.params; //id_course, name
        console.log("[genWorkbook] id_course: ", id_course);

        const text = `
            SELECT u.document, u.name, u.last_name, u.middle_name, t3.question_points, t3.activity_points
            FROM course_user AS cu
            INNER JOIN users AS u
            ON cu.id_user = u.id_user
            INNER JOIN (
              SELECT 
              CASE WHEN (t1.id_user > 0) THEN t1.id_user ELSE t2.id_user END AS id_user,
              CASE WHEN (t1.question_points > 0) THEN t1.question_points ELSE '0' END AS question_points,
              CASE WHEN (t2.activity_points > 0) THEN t2.activity_points ELSE '0' END AS activity_points
              FROM ( 
                SELECT uqc.id_user, count(uqc.id_user) AS question_points
                FROM modules AS m
                INNER JOIN classes AS c
                ON m.id_module = c.id_module
                INNER JOIN class_question AS cq
                ON c.id_class = cq.id_class
                INNER JOIN user_question_class AS uqc
                ON (cq.id_class = uqc.id_class AND cq.id_question = uqc.id_question)
                WHERE m.id_course = $1
                AND cq.status = 5
                AND uqc.status = 5
                GROUP BY uqc.id_user
              ) AS t1
              FULL JOIN (
                SELECT au.id_user, count(au.id_user) AS activity_points
                FROM modules AS m
                INNER JOIN classes AS c
                ON m.id_module = c.id_module
                INNER JOIN activities AS a
                ON c.id_class = a.id_class
                INNER JOIN activity_user AS au
                ON a.id_activity = au.id_activity
                WHERE m.id_course = $1
                AND a.status = 2
                AND au.status = 2
                GROUP BY au.id_user
              ) AS t2
              ON t1.id_user = t2.id_user
            ) AS t3
            ON u.id_user = t3.id_user
            WHERE cu.id_course = $1
            AND u.active = TRUE`;
        const values = [id_course];
        const { rows } = await pool.query(text, values);

        rows.forEach(item => {
            item.question_points = parseInt(item.question_points);
            item.activity_points = parseInt(item.activity_points);
            item.total = item.question_points + item.activity_points;
        });

        console.log("mario: ", rows);
        const text2 = `
        SELECT s.name AS subject, c.name AS course, c.code, c.course_goal, c.student_goal, ca.year, ca.semester
        FROM courses AS c
        INNER JOIN subjects AS s
        ON c.id_subject = s.id_subject
        INNER JOIN calendars AS ca
        ON c.id_calendar = c.id_calendar
        WHERE c.id_course = $1`;
        const values2 = [id_course];
        const info_data = (await pool.query(text2, values2)).rows[0];
        //console.log("repu: ", results);

        const result = { info: info_data, items: rows }
        //res.json(rows);

        //res = await createExcelFile(result, res);
        return createExcel(res, result, '');

        // Enviar el archivo excel
        // res.sendFile(filePath);

        //res.send()
    } catch (error) {
        next({ error });
    }
}

const createExcel = async (response, data, reportTypeNameForExcel) => {

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

        const { subject, course, code, course_goal, student_goal, year, semester } = data.info;
        // Content rows
        worksheet.addRow(["Puntuación de Estudiantes"]);
        worksheet.addRow([]);
        worksheet.addRow(['Emisión', new Date().toLocaleString("en-US", { timeZone: 'America/Santiago' }), 'Asignatura', subject.toUpperCase(), 'Curso', course.toUpperCase()]); //dd-mm-yyyy h:mm
        worksheet.addRow(['Código Curso', code.toUpperCase(), 'Año', year, 'Semestre', semester]);
        worksheet.addRow(['Meta Curso', course_goal, 'Meta Estudiante', student_goal, '---', '---']);
        worksheet.addRow([]);

        worksheet.mergeCells("A1:F1");
        worksheet.mergeCells("A2:F2");
        worksheet.mergeCells("A6:F6");

        // Añade una tabla
        worksheet.addTable({
            name: "MyTable",
            ref: "A7",
            headerRow: true,
            totalsRow: true,
            style: {
                theme: "TableStyleMedium12", // TableStyleMedium10 (rojo), TableStyleMedium12 (morado), TableStyleMedium9 (azul)
                showRowStripes: true
            },
            columns: [
                { name: "#" },
                { name: "Nombre", totalsRowLabel: "Totals:", filterButton: true },
                { name: "Rut", filterButton: false },
                { name: "Pts. por Pregunta", totalsRowFunction: "sum", filterButton: true },
                { name: "Pts. por Actividad", totalsRowFunction: "sum", filterButton: true },
                { name: "Total", totalsRowFunction: "sum", filterButton: true }
            ],
            rows: gege(data.items)
        });


        // Obtiene las columnas utilizadas
        let col_a = worksheet.getColumn('A');
        let col_b = worksheet.getColumn('B');
        let col_c = worksheet.getColumn('C');
        let col_d = worksheet.getColumn('D');
        let col_e = worksheet.getColumn('E');
        let col_f = worksheet.getColumn('F');

        // Establece propiedades de cada columna
        col_a = Object.assign(col_a, { width: 25, alignment: { horizontal: 'center' } });
        col_b = Object.assign(col_b, { width: 35, alignment: { horizontal: 'left' } });
        col_c = Object.assign(col_c, { width: 35, alignment: { horizontal: 'left' } });
        col_d = Object.assign(col_d, { width: 25, alignment: { horizontal: 'center' } });
        col_e = Object.assign(col_e, { width: 25, alignment: { horizontal: 'center' } });
        col_f = Object.assign(col_f, { width: 25, alignment: { horizontal: 'center' } });

        // Establece bordes a las siguientes celdas
        ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B3', 'B4', 'B5', 'C3', 'C4', 'C5', 'D3', 'D4', 'D5', 'E3', 'E4', 'E5', 'F3', 'F4', 'F5'].map(key => {
            worksheet.getCell(key).border = BORDER_PROPERTIES;
        });

        const TITLE_CELLS = ['A1', 'A3', 'A4', 'A5', 'C3', 'C4', 'C5', 'E3', 'E4', 'E5'];
        const NOTITLE_CELLS = ['B3', 'B4', 'B5', 'D3', 'D4', 'D5', 'F3', 'F4', 'F5'];
        // Setea las celdas de título
        TITLE_CELLS.map(key => {
            worksheet.getCell(key).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "8268A6" }
            };
            worksheet.getCell(key).font = {
                color: { argb: "ffffff" },
                bold: true
            };
            worksheet.getCell(key).alignment = { horizontal: 'left' };
        });

        NOTITLE_CELLS.map(key => {
            worksheet.getCell(key).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "E4DFEC" }
            };
            worksheet.getCell(key).alignment = { horizontal: 'left' };
        });

        // Setea las celdas de separación
        ['A2', 'A6'].map(key => {
            worksheet.getCell(key).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "CCC0DA" }
            }
        });

        // Set date format to 'B3' cell
        worksheet.getCell('B3').numFmt = 'dd/mm/yyyy\\ h:mm:ss';

        let title = worksheet.getCell('A1');

        title.alignment = {
            vertical: "middle",
            horizontal: "center"
        };
        title.font = {
            size: 12,
            bold: true,
            color: { argb: "ffffff" }
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
        //await workbook.xlsx.write(response);

        // workbook.xldx.writeBuffer()
        //     .then((data) => {
        //         let blob = new Blob([data], { type: EXCEL_TYPE });

        //     });
        //return response;

        //response.send();

        workbook.xlsx.write(response)
        .then(() => {
            response.end();
        });

    } catch (error) {
        console.log("errorcito: ", error);
    }

    

    
}

module.exports = {
    genWorkbook,
    createExcelFile,
    genExcel
};