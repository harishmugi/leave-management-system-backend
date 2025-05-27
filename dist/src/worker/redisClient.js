"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.connectRedis = connectRedis;
// redisClient.ts
const redis_1 = require("redis");
exports.redisClient = (0, redis_1.createClient)({
    url: process.env.UPSTASH_REDIS_URL, // Use .env to store
    socket: {
        connectTimeout: 15000, // 15s
        keepAlive: 30000 // keep connection open
    }
});
exports.redisClient.on('error', (err) => console.error('❌ Redis error:', err));
async function connectRedis() {
    if (!exports.redisClient.isOpen) {
        await exports.redisClient.connect();
    }
}
