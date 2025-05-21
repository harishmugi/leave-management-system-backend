import { Queue } from 'bullmq';

export const employeeQueue = new Queue('employee-create-queue', {
  connection: {
    url: process.env.REDIS_URL,
  },
});
