import { Queue } from 'bullmq';
import { RedisOptions } from 'ioredis';

export const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: {}, // Required for Upstash Redis
};


export const employeeQueue = new Queue('employee-create-queue', {
  connection: redisConnection,
});
