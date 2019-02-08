const { randomBytes } = require('crypto');
const signature = require('cookie-signature');
const cacheLib = require('../../cache');

const cacheSessionKey = 'session-30301231595959';

module.exports = (config) => {
  if (config.mode === 'job' || !config.cfg.session || !config.cfg.session.driver) {
    return null;
  }

  const sidKey = config.cfg.session.cookieName;
  const sidLen = config.cfg.session.keyLength;
  const rawLen = Math.ceil(sidLen * 0.75);

  const cache = cacheLib.init(cacheSessionKey, config.cfg.session);

  const clearSessionId = (req, res) => { // eslint-disable-line no-unused-vars
    delete req.sessionID;
    delete req.cookies[sidKey];
  };

  const setSessionId = (req, res, sessionid) => {
    if (sessionid) clearSessionId(req, res);
    else sessionid = randomBytes(rawLen).toString('base64').substring(0, sidLen); // eslint-disable-line no-param-reassign

    const signed = `${config.cfg.session.signPrefix}${signature.sign(sessionid, config.cfg.session.secret)}`;
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

    res.cookie(sidKey, signed, options);
    req.sessionID = sessionid;

    return sessionid;
  };

  const sessionId = (req, res) => {
    if (req.sessionID) {
      return req.sessionID;
    }

    let nsessionid;

    // Session ID from Signed Cookie
    const val = req.cookies[sidKey];
    const pfx = config.cfg.session.signPrefix;
    if (val && val.startsWith(pfx)) {
      try {
        nsessionid = signature.unsign(val.substring(pfx), config.cfg.session.secret);
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
