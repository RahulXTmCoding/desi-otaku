const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
  }

  async connect() {
    if (this.isConnected || this.isConnecting) {
      return this.client;
    }

    this.isConnecting = true;

    try {
      // Redis configuration from environment variables
      const redisConfig = {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('⚠️ Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.log('⚠️ Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 3) {
            console.log('⚠️ Redis max retry attempts reached');
            return undefined;
          }
          // Retry after 2 seconds
          return Math.min(options.attempt * 100, 2000);
        }
      };

      this.client = redis.createClient(redisConfig);

      // Error handling
      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔗 Redis Client Connected');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('🔌 Redis Client Disconnected');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      
      this.isConnecting = false;
      return this.client;

    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      this.isConnecting = false;
      this.isConnected = false;
      // Don't throw error - allow app to work without Redis
      return null;
    }
  }

  // Get data from cache
  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ Redis GET error:', error.message);
      return null;
    }
  }

  // Set data in cache with TTL (time to live in seconds)
  async set(key, data, ttlSeconds = 3600) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serializedData = JSON.stringify(data);
      await this.client.setEx(key, ttlSeconds, serializedData);
      return true;
    } catch (error) {
      console.error('❌ Redis SET error:', error.message);
      return false;
    }
  }

  // Delete data from cache
  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('❌ Redis DEL error:', error.message);
      return false;
    }
  }

  // Delete multiple keys matching pattern
  async delPattern(pattern) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('❌ Redis DEL pattern error:', error.message);
      return false;
    }
  }

  // Check if Redis is available
  isAvailable() {
    return this.isConnected && this.client;
  }

  // Get cache statistics
  async getStats() {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const info = await this.client.info('memory');
      return {
        connected: this.isConnected,
        memory: info
      };
    } catch (error) {
      console.error('❌ Redis stats error:', error.message);
      return null;
    }
  }

  // Graceful shutdown
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        console.log('✅ Redis connection closed gracefully');
      } catch (error) {
        console.error('❌ Error closing Redis connection:', error.message);
      }
    }
  }
}

// Export singleton instance
const redisService = new RedisService();

module.exports = redisService;
