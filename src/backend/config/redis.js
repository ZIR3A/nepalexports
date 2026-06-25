import Redis from 'ioredis';

let redisClient = null;

export const getRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  // Graceful fallback if REDIS_URL is not set
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1, // Don't block forever if Redis is down
      retryStrategy(times) {
        if (times > 3) {
          console.warn('Redis connection failed, giving up after 3 retries.');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
    });

    redisClient.on('error', (err) => {
      console.warn('Redis error (Caching will be bypassed):', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Successfully connected to Redis');
    });

  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    // Return a dummy client that ignores cache operations if initialization fails
    redisClient = createDummyClient();
  }

  return redisClient;
};

// Provides dummy methods so the app doesn't crash if Redis is unavailable
function createDummyClient() {
  console.warn('Using dummy Redis client. Caching is disabled.');
  return {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    sadd: async () => 1,
    srem: async () => 1,
    on: () => {},
  };
}
