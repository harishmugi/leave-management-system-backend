"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const employeeQueue_1 = require("./employeeQueue");
const userServices_1 = require("../userModule/userServices");
const worker = new bullmq_1.Worker('employee-create-queue', async (job) => {
    if (job.name === 'bulk-create') {
        const employees = job.data;
        console.log(`Processing ${employees.length} employees in bulk-create job`);
        for (const emp of employees) {
            try {
                await userServices_1.UserService.createEmployee(emp);
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
