import { createClient } from 'redis';
import { UserService } from '../userModule/userServices';
import { dataSource } from '../../db/connection';

const redis = createClient({ url: process.env.UPSTASH_REDIS_URL });

redis.on('error', (err) => console.error('Redis error:', err));

(async function startWorker() {
    await dataSource.initialize(); // important!

  await redis.connect();

  console.log('🚀 Worker started and waiting for employee data...');

  while (true) {
    try {
      const data = await redis.brPop('employee_queue', 0);
      if (!data) continue;

      const employee = JSON.parse(data.element);
      await UserService.createEmployee(employee);
      console.log(`✅ Created employee: ${employee.email}`);
    } catch (err) {
      console.error('❌ Worker error:', err);
    }
  }
})();
