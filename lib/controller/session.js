const uid = require('uid-safe').sync;
const signature = require('cookie-signature');
const sessionIdKey = 'DSESSIONID';

module.exports = (config) => {
    if (!config.cfg.session.driver) {
        return null;
    }

    var cache = require('../cache')(
        config.cfg.session.driver,
        config.cfg.session.connection);

    var setSessionId = (req, res) => {
      var sessionid = uid(32);
      var signed = 's:' + signature.sign(sessionid, config.cfg.session.secret);
      var expires = config.cfg.session.volatility ? 0 : new Date(Date.now() + (config.cfg.session.ttl * 1000));
      var options = {
          expires: expires,
          sameSite: true
      };

      res.cookie(sessionIdKey, signed, options);

      return sessionid;
    };

    var renewSessionId = (req, res) => {
      delete req.sessionID;
      delete req.cookies[sessionIdKey];
      return sessionId(req, res);
    };

    var sessionId = (req, res) => {
        if (req.sessionID) {
            return req.sessionID;
        }

        var nsessionid = undefined;

        // Session ID from Signed Cookie
        if (req.cookies[sessionIdKey]) {
            try {
                var temp = req.cookies[sessionIdKey].slice(2);
                temp = signature.unsign(temp, config.cfg.session.secret);
                nsessionid = temp;
            } catch(_) { }
        }

        // Generate New Session ID
        if (!nsessionid) {
            nsessionid = setSessionId(req, res);
        }

        req.sessionID = nsessionid;
        return nsessionid;
    };

    var sessionizedKey = (req, res, key) => {
        key = sessionId(req, res) + ':' + key;
        return key;
    };

    return {
        id: (req, res, renew) => {
          if (renew) {
            return renewSessionId(req, res);
          }
          else {
            return sessionId(req, res);
          }
        },
        set: (req, res, key, val, ttl) => {
            ttl = ttl || config.cfg.session.ttl;
            return cache.set(sessionizedKey(req, res, key), val, ttl);
        },
        get: (req, res, key, ttl) => {
            ttl = ttl || config.cfg.session.ttl;
            return cache.get(sessionizedKey(req, res, key), ttl);
        },
        del: (req, res, key) => {
            return cache.del(sessionizedKey(req, res, key));
        },
        ttl: (req, res, key) => {
            return cache.ttl(sessionizedKey(req, res, key));
        },
        expire: (req, res, key, ttl) => {
            return cache.expire(sessionizedKey(req, res, key), ttl);
        }
    }
};
