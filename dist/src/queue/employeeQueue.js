"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeQueue = exports.redisConnection = void 0;
const bullmq_1 = require("bullmq");
exports.redisConnection = {
    host: "0.0.0.0",
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: {}, // Required for Upstash Redis
};
exports.employeeQueue = new bullmq_1.Queue('employee-create-queue', {
    connection: exports.redisConnection,
});
