module.exports = (driver, connection) => {
  var cacheDriver = undefined;
  var cacheConn = undefined;

  if (typeof(driver) == 'object') {
    cacheDriver = driver;
  }
  else if (driver == 'redis') {
    cacheDriver = require('./driver/redis');
  }
  else {
    cacheDriver = require('./driver');
  }

  if (!cacheDriver.conn) {
    throw Error('Not Implemented, conn.');
  }

  var proxy = {};

  // Available cache functions. get, set, del, ...
  ['get', 'set', 'del', 'expire', 'ttl', 'close'].forEach((key) => {
    proxy[key] = (...args) => {
      if (!cacheDriver[key]) {
        throw Error('Not Implemented, ' + key);
      }

      const conn = cacheDriver.conn(connection);
      return cacheDriver[key].apply(this, [conn].concat(args));
    }
  });

  return proxy;
};
