const signature = require('cookie-signature');

module.exports = config => ({
  set: (req, res, key, val, opts) => {
    opts = opts || {}; // eslint-disable-line no-param-reassign
    const signed = `s:${signature.sign(val || '', config.cfg.cookie.secret)}`;

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
    if (req.cookies[key]) {
      try {
        const val = req.cookies[key];
        if (val.slice(0, 2) !== 's:') return val;
        return signature.unsign(val.slice(2), config.cfg.cookie.secret);
      } catch (_) {} // eslint-disable-line no-empty
    }
    return null;
  },
});
