"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.connectRedisWithRetry = connectRedisWithRetry;
// redisClient.ts
const redis_1 = require("redis");
const redisUrl = process.env.UPSTASH_REDIS_URL;
if (!redisUrl) {
    throw new Error('❌ Missing UPSTASH_REDIS_URL in environment variables.');
}
// Create Redis client with extended socket timeout and keep-alive
exports.redisClient = (0, redis_1.createClient)({
    url: redisUrl,
    socket: {
        connectTimeout: 15000, // 15 seconds to connect
        keepAlive: 30000 // Keep TCP connection alive
    }
});
// Log Redis-level errors
exports.redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
});
// Exported function with retry logic
async function connectRedisWithRetry(retries = 5) {
    while (retries > 0) {
        try {
            if (!exports.redisClient.isOpen) {
                console.log('🔌 Connecting to Redis...');
                await exports.redisClient.connect();
                console.log('✅ Redis connected');
            }
            break; // connected successfully
        }
        catch (err) {
            console.error(`❌ Redis connection failed: ${err.message}`);
            retries--;
            if (retries === 0) {
                console.error('🚫 Out of retries. Could not connect to Redis.');
                throw err; // Let app crash or handle as needed
            }
            console.log(`🔁 Retrying Redis connection in 3s... (${retries} retries left)`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }
}
