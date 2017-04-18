/**
 * Redirects naked(root domain) requests to www or its reverse.
 *
 * @author GONZO <oss@dp.farm>
 */


var subdomainParser = function() {
    const parseDomain = require('parse-domain');
    const parsedDomain = {};

    return {
        get: function(hostname) {
            // Cache, Touch
            if (parsedDomain[hostname] == undefined) {
                try {
                    var parsed = parseDomain(hostname);

                    parsedDomain[hostname] = [
                        parsed.subdomain,
                        parsed.domain + '.' + parsed.tld
                    ];
                }
                catch (e) {
                    parsedDomain[hostname] = [null, null];
                }
            }

            return parsedDomain[hostname];
        }
    }
}();

module.exports = function(reverse, subdomain) {
    return function(req, res, next) {
        var domain = subdomainParser.get(req.hostname);
        subdomain = subdomain || 'www';

        if (domain[0] == '' && !reverse) {
            res.redirect(req.protocol + '://' + subdomain + '.' + domain[1] + req.url);
            return;
        }
        else if (domain[0] == subdomain && reverse) {
            res.redirect(req.protocol + '://' + domain[1] + req.url);
            return;
        }

        return next();
    }
};
