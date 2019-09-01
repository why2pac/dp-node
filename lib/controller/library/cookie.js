'use strict';

module.exports = (config) => ({
  set: (req, res, key, val, opts) => {
    const item = opts || {};

    if (typeof item.expires === 'undefined') {
      const ttl = config.cfg.cookie.ttlMs;
      item.expires = ttl == null ? 0 : new Date(Date.now() + ttl);
    }

    if (typeof item.sameSite === 'undefined') {
      item.sameSite = true;
    }

    const signed = config.cfg.cookie.signer.sign(key, val, item.expires || null);
    res.cookie(key, signed, item);

    return true;
  },
  get: (req, res, key, unsafe) => config.cfg.cookie.signer.unsign(key, req.cookies[key], unsafe),
});
