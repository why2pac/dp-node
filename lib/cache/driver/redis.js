const redis = require('redis');
const bluebird = require('bluebird');
const driver = require('./index');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const caches = Object.create(null);
/* eslint-disable no-return-assign */
module.exports = {
  conn: (key, connection) => (
    key in caches ? caches[key] : (caches[key] = redis.createClient(connection))
  ),
  get: async (conn, key, ttl) => {
    const tran = conn().multi();
    tran.get(key);

    if (typeof ttl === 'number') {
      tran.expire(key, ttl);
    }

    const [res] = await tran.execAsync();
    return res ? driver.payload.parse(res) : null;
  },
  set: async (conn, key, val, ttl) => {
    const tran = conn().multi();
    tran.set(key, driver.payload.stringify(val));

    if (typeof ttl === 'number') {
      tran.expire(key, ttl);
    }

    const [res] = await tran.execAsync();
    return res === 'OK';
  },
  del: async (conn, key) => {
    const res = await conn().del(key);
    return res;
  },
  expire: async (conn, key, ttl) => {
    const tran = conn().multi();
    tran.expire(key, ttl);

    const [res] = await tran.execAsync();
    return res === 1;
  },
  ttl: async (conn, key) => {
    const tran = conn().multi();
    tran.ttl(key);

    const [res] = await tran.execAsync();
    return res;
  },
  close: (conn) => {
    conn().end(true);
  },
};
