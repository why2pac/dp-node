'use strict';

const signature = require('cookie-signature');

module.exports = config => ({
  set: (req, res, key, val, opts) => {
    const item = opts || {};
    const signed = `${config.cfg.cookie.signPrefix}${signature.sign(val || '', config.cfg.cookie.secret)}`;

    if (item.expires === undefined) {
      if (config.cfg.cookie.volatility) {
        item.expires = 0;
      } else {
        item.expires = new Date(Date.now() + config.cfg.cookie.ttl * 1e3);
      }
    }

    item.sameSite = true;

    res.cookie(key, signed, item);

    return true;
  },
  get: (req, res, key) => {
    const val = req.cookies[key];
    const pfx = config.cfg.cookie.signPrefix;
    if (val && val.startsWith(pfx)) {
      try {
        return signature.unsign(val.substring(pfx.length), config.cfg.cookie.secret);
      } catch (_) {
        if (!config.cfg.cookie.keepOnVerifyFail) return null;
      }
    }
    return val;
  },
});
