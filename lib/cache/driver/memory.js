const caches = {};
const cacher = function Cacher() {
  const values = {};
  return {
    get: (key) => {
      const val = values[key];
      if (!val) return undefined;
      return !val.exp || val.exp > Date.now() ? val.val : null;
    },
    set: (key, val, ttl) => {
      values[key] = {
        val,
        exp: ttl ? (Date.now() + (ttl * 1000)) : null,
      };
      return true;
    },
    del: (key) => {
      delete values[key];
      return true;
    },
    expire: (key, ttl) => {
      const val = values[key];
      if (!val || Date.now() >= val.exp) return false;

      val.exp = Date.now() + (ttl * 1000);
      return ttl;
    },
    ttl: (key) => {
      const val = values[key];
      if (!val || Date.now() >= val.exp) return -1;

      return (val.exp - Date.now()) / 1000;
    },
    close: () => {
      Object.keys(values).forEach((e) => {
        delete values[e];
      });
    },
  };
};

module.exports = {
  conn: (connection, key) => {
    if (caches[key]) return caches[key];
    caches[key] = cacher();
    return caches[key];
  },
  get: (conn, key, ttl) => conn().get(key, ttl),
  set: (conn, key, val, ttl) => conn().set(key, val, ttl),
  del: (conn, key) => conn().del(key),
  expire: (conn, key, ttl) => conn().expire(key, ttl),
  ttl: (conn, key) => conn().ttl(key),
  close: conn => conn().close(),
};
