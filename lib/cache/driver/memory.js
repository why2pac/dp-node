'use strict';

function Cacher() {
  let values = Object.create(null);
  this.get = (key) => {
    const val = values[key];
    if (!val) return undefined;
    return val.exp == null || val.exp > Date.now() ? val.val : null;
  };
  this.set = (key, val, ttl) => {
    const exp = ttl ? Date.now() + ttl * 1e3 : null;
    values[key] = { val, exp };
    return true;
  };
  this.del = key => delete values[key];
  this.expire = (key, ttl) => {
    const val = values[key];
    const ts = Date.now();
    if (!val || ts >= val.exp) return null;

    val.exp = ts + (ttl * 1e3);
    return ttl;
  };
  this.ttl = (key) => {
    const val = values[key];
    const ts = Date.now();
    return val && ts < val.exp ? (val.exp - ts) * 1e-3 : -1;
  };
  this.close = () => {
    values = Object.create(null);
  };
}

const caches = Object.create(null);
/* eslint-disable no-return-assign */
module.exports = {
  conn: (connection, key) => (key in caches ? caches[key] : (caches[key] = new Cacher())),
  get: (conn, key, ttl) => conn().get(key, ttl),
  set: (conn, key, val, ttl) => conn().set(key, val, ttl),
  del: (conn, key) => conn().del(key),
  expire: (conn, key, ttl) => conn().expire(key, ttl),
  ttl: (conn, key) => conn().ttl(key),
  close: conn => conn().close(),
};
