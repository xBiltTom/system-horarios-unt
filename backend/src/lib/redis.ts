/*import Redis from 'ioredis';
import { configuracionRedis } from '@/config/redis';

const redis = new Redis(configuracionRedis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Error Redis:', err.message);
});

redis.on('connect', () => {
  console.log('Conectado a Redis');
});

export { redis };*/

import Redis from 'ioredis';
import { configuracionRedis } from '@/config/redis';

const redis = new Redis(configuracionRedis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null; // Dejar de reintentar para no ensuciar la consola
    return Math.min(times * 50, 2000);
  },
  lazyConnect: true,
});

redis.on('error', (err: any) => {
  if (err.code !== 'ECONNREFUSED' && !err.message.includes('ECONNREFUSED')) {
    console.log('Error en Redis:', err.message);
  }
});

export { redis };