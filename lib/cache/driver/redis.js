const redis = require('redis');
const Promise = require('bluebird');
const driver = require('./index');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

module.exports = {
  conn: (connection) => {
    return redis.createClient(connection)
  },
  get: async (conn, key, ttl) => {
    var tran = conn.multi();
    tran.get(key);

    if (typeof(ttl) == 'number') {
      tran.expire(key, ttl);
    }

    var res = await tran.execAsync();
    return res[0] ? driver.payload.parse(res[0]) : null;
  },
  set: async (conn, key, val, ttl) => {
    var tran = conn.multi();
    tran.set(key, driver.payload.stringify(val));

    if (typeof(ttl) == 'number') {
      tran.expire(key, ttl);
    }

    var res = await tran.execAsync();
    return res[0] == 'OK';
  },
  del: async (conn, key) => {
    return await conn.del(key);
  },
  expire: async (conn, key, ttl) => {
    var tran = conn.multi();
    tran.expire(key, ttl);

    var res = await tran.execAsync();
    return res[0] == 1;
  },
  ttl: async (conn, key) => {
    var tran = conn.multi();
    tran.ttl(key);

    var res = await tran.execAsync();
    return res[0];
  }
}
