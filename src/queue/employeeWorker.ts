import { Worker, Job } from 'bullmq';
import { redisConnection } from './employeeQueue';
import { UserService } from '../userModule/userServices';
import { EmployeeData } from '../userModule/userServices';

export const employeeWorker = new Worker(
  'employee-create-queue',
  async (job: Job) => {
    const employees: EmployeeData[] = job.data;
    for (const emp of employees) {
      try {
        await UserService.createEmployee(emp);
      } catch (err) {
        console.error(`Error creating employee ${emp.email}:`, err);
        throw err;
      }
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    removeOnComplete: { count: 0 }, // ✅ fix here
    removeOnFail: { count: 3 },
  }
);
