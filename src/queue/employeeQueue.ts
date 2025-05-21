import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

console.log('REDIS_URL:', process.env.REDIS_URL);

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL env variable is missing!');
}

export const employeeQueue = new Queue('employee-create-queue', {
  connection: {
    url: process.env.REDIS_URL,
  },
});
