// employeeQueue.ts
import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

export const connectionOptions = {
  url: process.env.REDIS_URL,
};

export const employeeQueue = new Queue('employee-create-queue', {
  connection: connectionOptions,
});
