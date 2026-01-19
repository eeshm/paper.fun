import { createClient } from "redis";
import { RedisClientType } from "redis";

const client: RedisClientType = createClient({
  url: process.env.REDIS_URL
});

// Separate client for pub/sub subscriptions
// Redis requires a dedicated client for subscribe mode
const subscriber: RedisClientType = createClient({
  url: process.env.REDIS_URL
});

client.on('error', err => console.log('Redis Client Error', err));
subscriber.on('error', err => console.log('Redis Subscriber Error', err));

export default client;
export { subscriber };
