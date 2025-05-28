import ExcelJS from 'exceljs';
import { EmployeeData } from '../userModule/userServices';
import { redisClient, connectRedisWithRetry} from '../worker/redisClient';

function normalizeCellValue(cell: any): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'object' && 'text' in cell) return cell.text;
  return String(cell).trim();
}

export async function parseExcel(buffer: Buffer): Promise<EmployeeData[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const employees: EmployeeData[] = [];

  worksheet.eachRow((row, index) => {
    if (index === 1) return;

    const rowData = row.values as any[];

    const email = normalizeCellValue(rowData[1]).toLowerCase();
    const fullname = normalizeCellValue(rowData[2]);
    const password = normalizeCellValue(rowData[3]);
    const role = normalizeCellValue(rowData[4]) as EmployeeData['role'];
    const managerEmail = normalizeCellValue(rowData[5]).toLowerCase() || null;

    if (!email || !fullname || !password || !role) {
      console.warn(`⚠️ Skipping row ${index} - Missing required fields`);
      return;
    }

    employees.push({
      email,
      fullname,
      password,
      role,
      managerEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  console.log(`✅ Parsed ${employees.length} employees`);
  return employees;
}

export async function pushEmployeesToQueue(employees: EmployeeData[]) {
  await connectRedisWithRetry();

  const pipeline = redisClient.multi();

  employees.forEach((emp) => {
    pipeline.rPush('employee_queue', JSON.stringify(emp));
  });

  await pipeline.exec();
  console.log(`✅ Pushed ${employees.length} employees to queue`);

  await redisClient.disconnect();
}
