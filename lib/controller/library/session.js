'use strict';

const { randomBytes } = require('crypto');
const signature = require('cookie-signature');
const cacheLib = require('../../cache');

const cacheSessionKey = 'session-30301231595959';

module.exports = (config) => {
  if (config.mode === 'job' || !config.cfg.session || !config.cfg.session.driver) {
    return null;
  }

  const cache = cacheLib.init(cacheSessionKey, config.cfg.session);

  const clearSessionId = (req, _res) => {
    delete req.sessionID;
    delete req.cookies[config.cfg.session.cookieName];
  };

  const setSessionId = (req, res, sessionid) => {
    if (sessionid) clearSessionId(req, res);
    else {
      const len = config.cfg.session.keyLength;
      const ral = len - Math.floor(len * 0.25);
      sessionid = randomBytes(ral).toString('base64').substring(0, len); // eslint-disable-line no-param-reassign
    }

    const signed = `${config.cfg.session.signPrefix}${signature.sign(sessionid, config.cfg.session.secret)}`;
    let expires;

    if (config.cfg.session.volatility) {
      expires = 0;
    } else {
      expires = new Date(Date.now() + config.cfg.session.ttl * 1e3);
    }

    const options = {
      expires,
      sameSite: true,
    };

    res.cookie(config.cfg.session.cookieName, signed, options);
    req.sessionID = sessionid;

    return sessionid;
  };

  const sessionId = (req, res) => {
    if (req.sessionID) {
      return req.sessionID;
    }

    let nsessionid;

    // Session ID from Signed Cookie
    const val = req.cookies[config.cfg.session.cookieName];
    const pfx = config.cfg.session.signPrefix;
    if (val && val.startsWith(pfx)) {
      try {
        nsessionid = signature.unsign(val.substring(pfx.length), config.cfg.session.secret);
      } catch (_) {
        // Ignore invalid signature
      }
    }

    // Generate New Session ID
    if (!nsessionid) {
      nsessionid = setSessionId(req, res);
    }

    return nsessionid;
  };

  const renewSessionId = (req, res) => {
    clearSessionId(req, res);
    return sessionId(req, res);
  };

  const sessionizedKey = (req, res, key) => `${sessionId(req, res)}:${key}`;

  return {
    engine: () => cache,
    id: (req, res, renewOrSet) => {
      switch (true) {
        case typeof renewOrSet === 'string':
          return setSessionId(req, res, renewOrSet);
        case renewOrSet:
          return renewSessionId(req, res);
        default:
          return sessionId(req, res);
      }
    },
    set: (req, res, key, val, ttl) => {
      ttl = ttl || config.cfg.session.ttl; // eslint-disable-line no-param-reassign
      return cache.set(sessionizedKey(req, res, key), val, ttl);
    },
    get: (req, res, key, ttl) => {
      ttl = ttl || config.cfg.session.ttl; // eslint-disable-line no-param-reassign
      return cache.get(sessionizedKey(req, res, key), ttl);
    },
    del: (req, res, key) => cache.del(sessionizedKey(req, res, key)),
    ttl: (req, res, key) => cache.ttl(sessionizedKey(req, res, key)),
    expire: (req, res, key, ttl) => cache.expire(sessionizedKey(req, res, key), ttl),
  };
};
