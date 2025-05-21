"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeQueue = exports.redisConnection = void 0;
const bullmq_1 = require("bullmq");
exports.redisConnection = {
    host: '127.0.0.1',
    port: 6379,
};
exports.employeeQueue = new bullmq_1.Queue('employee-create-queue', {
    connection: exports.redisConnection,
});
