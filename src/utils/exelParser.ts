

import { RedisOptions } from 'ioredis';

export const redisConnection: RedisOptions = {
  host: '127.0.0.1',
  port: 6379,
};






import ExcelJS from 'exceljs';
import { EmployeeData } from '../userModule/userServices';

export async function parseExcel(buffer: Buffer): Promise<EmployeeData[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const employees: EmployeeData[] = [];

  worksheet.eachRow((row, index) => {
    if (index === 1) return; // skip header

    // Normalize row.values to an array:
    const valuesArray = Array.isArray(row.values) ? row.values : Object.values(row.values);

    // Remove the first element (index 0) which is empty for ExcelJS row.values
    const rowData = valuesArray.slice(1);

    // Now destructure safely
    const [email, fullname, password, role, managerEmail, hrEmail, directorEmail] = rowData as string[];

    employees.push({
      email,
      fullname,
      password,
      role: role as 'Employee' | 'Manager' | 'HR' | 'Director',
      managerEmail,
      hrEmail,
      directorEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  return employees;
}
