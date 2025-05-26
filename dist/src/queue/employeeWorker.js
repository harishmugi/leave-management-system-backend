// import { Worker } from 'bullmq';
// import { employeeQueue, connectionOptions } from './employeeQueue';
// import { UserService } from '../userModule/userServices';
// const worker = new Worker('employee-create-queue', async job => {
//   if (job.name === 'bulk-create') {
//     const employees = job.data;
//     console.log(`Processing ${employees.length} employees in bulk-create job`);
//     for (const emp of employees) {
//       try {
//         await UserService.createEmployee(emp);
//       } catch (err) {
//         console.error(`Failed to create employee ${emp.email}`, err);
//       }
//     }
//   }
// }, {
//   connection: connectionOptions
// });
// worker.on('completed', (job) => {
//   console.log(`Job ${job.id} completed`);
// });
// worker.on('failed', (job, err) => {
//   console.error(`Job ${job?.id} failed:`, err);
// });
