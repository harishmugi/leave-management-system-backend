import { Queue } from 'bullmq';
import dotenv from 'dotenv'
dotenv.config();
console.log('asdasd',process.env.REDIS_URL)
export const employeeQueue = new Queue('employee-create-queue', {
  connection: {
    url: process.env.REDIS_URL,
  },
});
