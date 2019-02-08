'use strict';

const exportCacheMethods = ['get', 'set', 'del', 'expire', 'ttl', 'close'];
const cachers = {};

const Cache = function Cache(config) {
  // Assign engine when test mode enabled.
  if (global.isTest) {
    global.__dpCachers__ = cachers; // eslint-disable-line no-underscore-dangle
  }

  const Cacher = function Cacher(key) {
    const dsn = (config.cfg.cacheDsn || {})[key];

    if (!dsn) {
      throw new Error(`The speified 'dsn(${key})' is not found.`);
    }

    return Cache.init(key, dsn);
  };

  const defDsnKey = Object.keys(config.cfg.cacheDsn || {}).find(e => e);
  const defDsn = config.cfg.cacheDsn.default || (defDsnKey ? config.cfg.cacheDsn[defDsnKey] : null);
  const defCacherKey = `default-${Date.now()}`;
  const defCacher = defDsn ? Cache.init(defCacherKey, defDsn) : null;

  exportCacheMethods.forEach((method) => {
    Cacher[method] = (...args) => {
      if (!defCacher) throw new Error('No cache dsn found available.');
      return defCacher[method](...args);
    };
  });

  return Cacher;
};

Cache.init = (key, dsn) => {
  if (cachers[key]) return cachers[key];

  let cacheDriver;
  const driver = dsn.driver || dsn.client;

  if (driver === 'memory') {
    cacheDriver = require('./driver/memory'); // eslint-disable-line global-require
  } else if (driver === 'redis') {
    cacheDriver = require('./driver/redis'); // eslint-disable-line global-require
  } else {
    cacheDriver = require('./driver'); // eslint-disable-line global-require
  }

  if (!cacheDriver.conn) {
    throw Error('Not Implemented, conn.');
  }

  const proxy = {};
  let connLazy;
  const conn = () => {
    if (connLazy) return connLazy;
    connLazy = cacheDriver.conn(key, dsn.connection);
    return connLazy;
  };

  // Available cache functions. get, set, del, ...
  exportCacheMethods.forEach((method) => {
    proxy[method] = (...args) => {
      if (!cacheDriver[method]) {
        throw Error(`Not Implemented, ${method}`);
      }

      return cacheDriver[method](conn, ...args);
    };
  });

  cachers[key] = proxy;
  return proxy;
};

module.exports = Cache;
