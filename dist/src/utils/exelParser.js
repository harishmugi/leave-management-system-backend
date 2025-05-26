"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExcel = parseExcel;
const exceljs_1 = __importDefault(require("exceljs"));
function normalizeCellValue(cell) {
    if (cell === null || cell === undefined)
        return '';
    if (typeof cell === 'object' && 'text' in cell)
        return cell.text;
    return String(cell);
}
async function parseExcel(buffer) {
    const workbook = new exceljs_1.default.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const employees = [];
    worksheet.eachRow((row, index) => {
        if (index === 1)
            return; // skip header
        // ExcelJS row.values is an array starting at index 1 (0 is empty)
        const rowData = row.values;
        const email = normalizeCellValue(rowData[1]);
        const fullname = normalizeCellValue(rowData[2]);
        const password = normalizeCellValue(rowData[3]);
        const role = normalizeCellValue(rowData[4]);
        const managerEmail = normalizeCellValue(rowData[5]);
        const hrEmail = normalizeCellValue(rowData[6]);
        const directorEmail = normalizeCellValue(rowData[7]);
        // Skip if email or fullname is missing
        if (!email || !fullname) {
            console.warn(`Skipping row ${index} due to missing email or fullname`);
            return;
        }
        employees.push({
            email,
            fullname,
            password,
            role,
            managerEmail: managerEmail || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    });
    console.log('Parsed employees:', employees);
    return employees;
}
