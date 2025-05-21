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

  const employees: EmployeeData[] = [];

  worksheet.eachRow((row, index) => {
    if (index === 1) return; // skip header

    // ExcelJS row.values is an array starting at index 1 (0 is empty)
    const rowData = row.values as any[];

    const email = normalizeCellValue(rowData[1]);
    const fullname = normalizeCellValue(rowData[2]);
    const password = normalizeCellValue(rowData[3]);
    const role = normalizeCellValue(rowData[4]) as 'Employee' | 'Manager' | 'HR' | 'Director';
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
      hrEmail: hrEmail || null,
      directorEmail: directorEmail || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  console.log('Parsed employees:', employees);
  return employees;
}
