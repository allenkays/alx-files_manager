import { createClient } from 'redis';
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.client.on('error', (error) => {
      console.error(`Redis Error: ${error}`);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return await this.getAsync(key);
  }

  async set(key, value, duration) {
    const asyncSet = promisify(this.client.set).bind(this.client);
    return await asyncSet(key, value, 'EX', duration);
  }

  async del(key) {
    const asyncDel = promisify(this.client.del).bind(this.client);
    return await asyncDel(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
