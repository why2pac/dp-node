'use strict';

const { randomBytes } = require('crypto');
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

    const ttl = config.cfg.session.ttlMs;
    const expires = ttl == null ? 0 : new Date(Date.now() + ttl);

    const options = {
      expires,
      sameSite: true,
    };

    const key = config.cfg.session.cookieName;
    const signed = config.cfg.session.signer.sign(key, sessionid, expires || null);
    res.cookie(key, signed, options);
    req.sessionID = sessionid;

    return sessionid;
  };

  const sessionId = (req, res) => {
    if (req.sessionID) {
      return req.sessionID;
    }

    // Session ID from Signed Cookie
    const key = config.cfg.session.cookieName;
    const val = req.cookies[key];
    let nsessionid = config.cfg.session.signer.unsign(key, val);

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
