import { Worker, Job } from 'bullmq';
import { redisConnection } from './employeeQueue';
import { UserService } from '../userModule/userServices';
import { EmployeeData } from '../userModule/userServices';
import { UserValidator } from '../userModule/userValidator';

export const employeeWorker = new Worker(
  'employee-create-queue',
  async (job: Job) => {
    const employees: EmployeeData[] = job.data;

    for (const emp of employees) {
      try {
        await UserValidator.checkUserAlreadyExist(emp.email);
        await UserService.createEmployee(emp);
        console.log(`✅ Created employee: ${emp.email}`);
      } catch (err) {
        console.error(`❌ Error creating employee ${emp.email}:`, err);
        // Don't throw — continue with next employee
      }
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    removeOnComplete: { count: 0 },
    removeOnFail: { count: 3 },
  }
);
