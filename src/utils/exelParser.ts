import ExcelJS from 'exceljs';
import { EmployeeData } from '../userModule/userServices';

function normalizeCellValue(cell: any): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'object' && 'text' in cell) return cell.text;
  return String(cell);
}

export async function parseExcel(buffer: Buffer): Promise<EmployeeData[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const employees= [];

  worksheet.eachRow((row, index) => {
    if (index === 1) return; // Skip header

    const rowData = row.values as any[];

    const email = normalizeCellValue(rowData[1]);
    const fullname = normalizeCellValue(rowData[2]);
    const password = normalizeCellValue(rowData[3]);
    const role = normalizeCellValue(rowData[4]) as EmployeeData['role'];
    const managerEmail = normalizeCellValue(rowData[5]);

    if (!email || !fullname || !password || !role) {
      console.warn(`⚠️ Skipping row ${index} - Missing required fields`);
      return;
    }

    employees.push({
      email,
      fullname,
      password,
      role,
      managerEmail: managerEmail || null,
  
    });
  });

  console.log('📊 Parsed employees:', employees);
  return employees;
}