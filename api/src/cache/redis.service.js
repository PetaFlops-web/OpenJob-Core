import { createClient } from "redis";
import logger from "../utils/logger.js";

let _client = null;
let _connectPromise = null;

async function getSharedClient() {
  if (_client?.isOpen) return _client;
  if (_connectPromise) return _connectPromise;

  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client.on("error", (error) => {
    _client = null;
    _connectPromise = null;
    logger.error(error);
  });

  _connectPromise = client.connect()
    .then(() => {
      _client = client;
      _connectPromise = null;
      return client;
    })
    .catch((error) => {
      _client = null;
      _connectPromise = null;
      throw error;
    });

  return _connectPromise;
}

class CacheService {
  async set(key, value, expirationInSecond = 3600) {
    try {
      const client = await getSharedClient();
      await client.set(key, value, {
        EX: expirationInSecond,
      });
    } catch (error) {
      logger.warn("Redis SET failed", error);
    }
  }

  async get(key) {
    try {
      const client = await getSharedClient();
      return await client.get(key);
    } catch (error) {
      logger.warn("Redis GET failed", error);
      return null;
    }
  }

  async delete(key) {
    try {
      const client = await getSharedClient();
      return await client.del(key);
    } catch (error) {
      logger.warn("Redis DELETE failed", error);
      return 0;
    }
  }
}

async function closeCacheService() {
  const client = _client ?? (await _connectPromise?.catch(() => null));
  _client = null;
  _connectPromise = null;

  if (client?.isOpen) {
    await client.quit();
  }
}

export { closeCacheService };
export default CacheService;
