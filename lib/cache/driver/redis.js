const redis = require('redis');
const bluebird = require('bluebird');
const driver = require('./index');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

let client = null;

module.exports = {
  conn: (connection) => {
    if (!client) {
      client = redis.createClient(connection);
    }
    return client;
  },
  get: async (conn, key, ttl) => {
    const tran = conn.multi();
    tran.get(key);

    if (typeof (ttl) === 'number') {
      tran.expire(key, ttl);
    }

    const res = await tran.execAsync();
    return res[0] ? driver.payload.parse(res[0]) : null;
  },
  set: async (conn, key, val, ttl) => {
    const tran = conn.multi();
    tran.set(key, driver.payload.stringify(val));

    if (typeof (ttl) === 'number') {
      tran.expire(key, ttl);
    }

    const res = await tran.execAsync();
    return res[0] === 'OK';
  },
  del: async (conn, key) => {
    const res = await conn.del(key);
    return res;
  },
  expire: async (conn, key, ttl) => {
    const tran = conn.multi();
    tran.expire(key, ttl);

    const res = await tran.execAsync();
    return res[0] === 1;
  },
  ttl: async (conn, key) => {
    const tran = conn.multi();
    tran.ttl(key);

    const res = await tran.execAsync();
    return res[0];
  },
  close: (conn) => {
    conn.end(true);
    client = null;
  },
};
