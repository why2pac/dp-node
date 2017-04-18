const uid = require('uid-safe').sync;
const signature = require('cookie-signature');
const sessionIdKey = 'NSESSIONID';

module.exports = (config) => {
    if (!config.cfg.session.driver) {
        return null;
    }

    var cache = require('../cache')(
        config.cfg.session.driver,
        config.cfg.session.connection);

    var sessionID = (req, res) => {
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
            nsessionid = uid(32);
            var signed = 's:' + signature.sign(nsessionid, config.cfg.session.secret);
            var options = {
                expires: new Date(Date.now() + (config.cfg.session.ttl * 1000)),
                sameSite: true
            };

            res.cookie(sessionIdKey, signed, options);
        }

        req.sessionID = nsessionid;
        return nsessionid;
    };

    var sessionizedKey = (req, res, key) => {
        key = sessionID(req, res) + ':' + key;
        return key;
    };

    return {
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
