module.exports = (dsn) => {
  let cacheDriver;

  if (dsn.driver === 'redis') {
    cacheDriver = require('./driver/redis'); // eslint-disable-line global-require
  } else {
    cacheDriver = require('./driver'); // eslint-disable-line global-require
  }

  if (!cacheDriver.conn) {
    throw Error('Not Implemented, conn.');
  }

  const proxy = {};

  // Available cache functions. get, set, del, ...
  ['get', 'set', 'del', 'expire', 'ttl', 'close'].forEach((key) => {
    proxy[key] = (...args) => {
      if (!cacheDriver[key]) {
        throw Error(`Not Implemented, ${key}`);
      }

      const conn = cacheDriver.conn(dsn.connection);
      return cacheDriver[key].apply(this, [conn].concat(args));
    };
  });

  return proxy;
};
