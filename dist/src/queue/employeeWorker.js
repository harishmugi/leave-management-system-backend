"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeWorker = void 0;
const bullmq_1 = require("bullmq");
const employeeQueue_1 = require("./employeeQueue");
const userServices_1 = require("../userModule/userServices");
exports.employeeWorker = new bullmq_1.Worker('employee-create-queue', async (job) => {
    const employees = job.data;
    for (const emp of employees) {
        try {
            await userServices_1.UserService.createEmployee(emp);
        }
        catch (err) {
            console.error(`Error creating employee ${emp.email}:`, err);
            throw err;
        }
    }
}, {
    connection: employeeQueue_1.redisConnection,
    concurrency: 5,
    removeOnComplete: { count: 0 }, // ✅ fix here
    removeOnFail: { count: 3 },
});
