'use strict';

const exportCacheMethods = ['get', 'set', 'del', 'expire', 'ttl', 'close'];
const cachers = {};

function Cache(config) {
  // Assign engine when test mode enabled.
  if (global.isTest) {
    global.__dpCachers__ = cachers;
  }

  function Cacher(key) {
    const dsn = (config.cfg.cacheDsn || {})[key];
    if (!dsn) throw new Error(`The speified 'dsn(${key})' is not found.`);
    return Cache.init(key, dsn);
  }

  const defDsnKey = Object.keys(config.cfg.cacheDsn || {}).find(Boolean);
  const defDsn = config.cfg.cacheDsn.default || (defDsnKey && config.cfg.cacheDsn[defDsnKey]);
  const defCacherKey = `default-${Date.now()}`;
  const defCacher = defDsn && Cache.init(defCacherKey, defDsn);

  exportCacheMethods.forEach((method) => {
    Cacher[method] = (...args) => {
      if (!defCacher) throw new Error('No cache dsn found available.');
      return defCacher[method](...args);
    };
  });

  return Cacher;
}

const knownDrivers = {
  memory: 'memory',
  redis: 'redis',
  stub: 'stub',
};
const hasOwn = Object.prototype.hasOwnProperty;

Cache.init = (key, dsn) => {
  const existing = cachers[key];
  if (existing) return existing;

  const driver = dsn.driver || dsn.client;

  let driverModule = './driver';
  if (hasOwn.call(knownDrivers, driver)) {
    driverModule = `${driverModule}/${knownDrivers[driver]}`;
  }
  const cacheDriver = require(driverModule);

  if (!cacheDriver.conn) {
    throw Error('Not Implemented, conn.');
  }

  let connLazy;
  const conn = () => {
    if (!connLazy) connLazy = cacheDriver.conn(key, dsn.connection);
    return connLazy;
  };

  const proxy = {};
  // Available cache functions. get, set, del, ...
  exportCacheMethods.forEach(method => Object.defineProperty(proxy, method, {
    value(...args) {
      if (!cacheDriver[method]) {
        throw Error(`Not Implemented, ${method}`);
      }

      return cacheDriver[method](conn, ...args);
    },
    writable: true,
    enumerable: false,
    configurable: true,
  }));

  cachers[key] = proxy;
  return proxy;
};

module.exports = Cache;
