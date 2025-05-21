"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeWorker = void 0;
const bullmq_1 = require("bullmq");
const employeeQueue_1 = require("./employeeQueue");
const userServices_1 = require("../userModule/userServices");
const userValidator_1 = require("../userModule/userValidator");
exports.employeeWorker = new bullmq_1.Worker('employee-create-queue', async (job) => {
    const employees = job.data;
    for (const emp of employees) {
        try {
            await userValidator_1.UserValidator.checkUserAlreadyExist(emp.email);
            await userServices_1.UserService.createEmployee(emp);
            console.log(`✅ Created employee: ${emp.email}`);
        }
        catch (err) {
            console.error(`❌ Error creating employee ${emp.email}:`, err);
            // Don't throw — continue with next employee
        }
    }
}, {
    connection: employeeQueue_1.redisConnection,
    concurrency: 5,
    removeOnComplete: { count: 0 },
    removeOnFail: { count: 3 },
});
