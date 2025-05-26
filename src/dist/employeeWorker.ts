// worker.ts
import { Worker } from 'bullmq';
import { connectionOptions } from './employeeQueue';
import { UserService, EmployeeData } from '../userModule/userServices';

const worker = new Worker('employee-create-queue', async job => {
  if (job.name === 'bulk-create') {
    const employees: EmployeeData[] = job.data;

    if (!employees || employees.length === 0) {
      console.warn(`Job ${job.id} has no employees to process`);
      return;
    }

    console.log(`Processing ${employees.length} employees in bulk-create job`);

    for (const emp of employees) {
      try {
        await UserService.createEmployee(emp);
        console.log(`Created employee: ${emp.email}`);
      } catch (err) {
        console.error(`Failed to create employee ${emp.email}`, err);
      }
    }
  }
}, {
  connection: connectionOptions
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});
