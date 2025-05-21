"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeQueue = exports.connectionOptions = void 0;
// employeeQueue.ts
const bullmq_1 = require("bullmq");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.connectionOptions = {
    url: process.env.REDIS_URL,
};
exports.employeeQueue = new bullmq_1.Queue('employee-create-queue', {
    connection: exports.connectionOptions,
});
