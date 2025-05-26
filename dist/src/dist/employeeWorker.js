"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// worker.ts
const bullmq_1 = require("bullmq");
const employeeQueue_1 = require("./employeeQueue");
const userServices_1 = require("../userModule/userServices");
const worker = new bullmq_1.Worker('employee-create-queue', async (job) => {
    if (job.name === 'bulk-create') {
        const employees = job.data;
        if (!employees || employees.length === 0) {
            console.warn(`Job ${job.id} has no employees to process`);
            return;
        }
        console.log(`Processing ${employees.length} employees in bulk-create job`);
        for (const emp of employees) {
            try {
                await userServices_1.UserService.createEmployee(emp);
                console.log(`Created employee: ${emp.email}`);
            }
            catch (err) {
                console.error(`Failed to create employee ${emp.email}`, err);
            }
        }
    }
}, {
    connection: employeeQueue_1.connectionOptions
});
worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});
worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});
// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
    console.log('Shutting down worker...');
    await worker.close();
    process.exit(0);
});
