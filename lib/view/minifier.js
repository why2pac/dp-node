const minify = require('html-minifier').minify
var options = {
  removeComments: true,
  collapseWhitespace: true,
  removeAttributeQuotes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true
}

module.exports = {
  html: (origin, config) => {
    return new Promise((resolve, reject) => {
      try {
        if (config.cfg.minifyRemoveLineBreakWhitespace) {
          origin = origin.split('\n').map((e) => { return e.trim() }).join('')
        }

        var minified = minify(origin, options)
        resolve(minified)
      } catch (e) {
        resolve(origin)
      }
    })
  }
}
