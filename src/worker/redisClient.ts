// redisClient.ts
import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.UPSTASH_REDIS_URL, // Use .env to store

   socket: {
    connectTimeout: 15000, // 15s
    keepAlive: 30000       // keep connection open
  }
});

redisClient.on('error', (err) => console.error('❌ Redis error:', err));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}
