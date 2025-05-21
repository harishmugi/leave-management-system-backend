import { Queue } from 'bullmq';
import { RedisOptions } from 'ioredis';

export const redisConnection: RedisOptions = {
  host: '127.0.0.1',
  port: 6379,
};

export const employeeQueue = new Queue('employee-create-queue', {
  connection: redisConnection,
});
