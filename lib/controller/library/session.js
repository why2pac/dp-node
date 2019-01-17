const uid = require('uid-safe').sync;
const signature = require('cookie-signature');
const cacheLib = require('../../cache');

const defaultSessionIdKey = 'DSESSIONID';

module.exports = (config) => {
  if (config.mode === 'job' || !config.cfg.session || !config.cfg.session.driver) {
    return null;
  }

  const sessionIdKey = config.cfg.session.cookieName || defaultSessionIdKey;

  const cache = cacheLib(
    config.cfg.session.driver,
    config.cfg.session.connection // eslint-disable-line comma-dangle
  );

  const clearSessionId = (req, res) => { // eslint-disable-line no-unused-vars
    delete req.sessionID;
    delete req.cookies[sessionIdKey];
  };

  const setSessionId = (req, res, sessionid) => {
    if (sessionid) clearSessionId(req, res);
    sessionid = sessionid || uid(32); // eslint-disable-line no-param-reassign

    const signed = `s:${signature.sign(sessionid, config.cfg.session.secret)}`;
    let expires;

    if (config.cfg.session.volatility) {
      expires = 0;
    } else {
      expires = new Date(Date.now() + (config.cfg.session.ttl * 1000));
    }

    const options = {
      expires,
      sameSite: true,
    };

    res.cookie(sessionIdKey, signed, options);
    req.sessionID = sessionid;

    return sessionid;
  };

  const sessionId = (req, res) => {
    if (req.sessionID) {
      return req.sessionID;
    }

    let nsessionid;

    // Session ID from Signed Cookie
    if (req.cookies[sessionIdKey]) {
      try {
        let temp = req.cookies[sessionIdKey].slice(2);
        temp = signature.unsign(temp, config.cfg.session.secret);
        nsessionid = temp;
      } catch (_) { } // eslint-disable-line no-empty
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

  const sessionizedKey = (req, res, key) => {
    key = `${sessionId(req, res)}:${key}`; // eslint-disable-line no-param-reassign
    return key;
  };

  return {
    engine: () => cache,
    id: (req, res, renewOrSet) => {
      if (typeof (renewOrSet) === 'string') {
        return setSessionId(req, res, renewOrSet);
      } if (renewOrSet === true) {
        return renewSessionId(req, res);
      }
      return sessionId(req, res);
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
