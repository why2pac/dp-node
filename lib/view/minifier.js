const Promise = require('bluebird');
const minify = require('html-minifier').minify;
var options = {
    removeComments:                 true,
    collapseWhitespace:             true,
    removeAttributeQuotes:          true,
    removeScriptTypeAttributes:     true,
    removeStyleLinkTypeAttributes:  true
}

module.exports = {
    html: (origin) => {
        return new Promise((resolve, reject) => {
            try {
                var minified = minify(origin, options);
                resolve(minified);
            }
            catch (e) {
                resolve(origin);
            }
        })
    }
}
