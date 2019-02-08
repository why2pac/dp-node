'use strict';

const signature = require('cookie-signature');

module.exports = config => ({
  set: (req, res, key, val, opts) => {
    opts = opts || {}; // eslint-disable-line no-param-reassign
    const signed = `${config.cfg.cookie.signPrefix}${signature.sign(val || '', config.cfg.cookie.secret)}`;

    if (opts.expires === undefined) {
      if (config.cfg.cookie.volatility) {
        opts.expires = 0; // eslint-disable-line no-param-reassign
      } else {
        // eslint-disable-next-line no-param-reassign
        opts.expires = new Date(Date.now() + (config.cfg.cookie.ttl * 1000));
      }
    }

    opts.sameSite = true; // eslint-disable-line no-param-reassign

    res.cookie(key, signed, opts);

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
