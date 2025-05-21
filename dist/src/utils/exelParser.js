"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
exports.parseExcel = parseExcel;
exports.redisConnection = {
    host: '127.0.0.1',
    port: 6379,
};
const exceljs_1 = __importDefault(require("exceljs"));
async function parseExcel(buffer) {
    const workbook = new exceljs_1.default.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const employees = [];
    worksheet.eachRow((row, index) => {
        if (index === 1)
            return; // skip header
        // Normalize row.values to an array:
        const valuesArray = Array.isArray(row.values) ? row.values : Object.values(row.values);
        console.log("valuesArray", valuesArray);
        // Remove the first element (index 0) which is empty for ExcelJS row.values
        const rowData = valuesArray.slice(1);
        console.log("rowData", rowData);
        // Now destructure safely
        const [email, fullname, password, role, managerEmail, hrEmail, directorEmail] = rowData;
        employees.push({
            email,
            fullname,
            password,
            role: role,
            managerEmail,
            hrEmail,
            directorEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        console.log('excel parces', employees);
    });
    return employees;
}
