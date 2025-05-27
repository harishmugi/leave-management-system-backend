"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const userServices_1 = require("../userModule/userServices");
const connection_1 = require("../../db/connection");
const redis = (0, redis_1.createClient)({ url: process.env.UPSTASH_REDIS_URL });
redis.on('error', (err) => console.error('Redis error:', err));
(async function startWorker() {
    await connection_1.dataSource.initialize(); // important!
    await redis.connect();
    console.log('🚀 Worker started and waiting for employee data...');
    while (true) {
        try {
            const data = await redis.brPop('employee_queue', 0);
            if (!data)
                continue;
            const employee = JSON.parse(data.element);
            await userServices_1.UserService.createEmployee(employee);
            console.log(`✅ Created employee: ${employee.email}`);
        }
        catch (err) {
            console.error('❌ Worker error:', err);
        }
    }
})();
