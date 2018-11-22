const { minify } = require('html-minifier');

const options = {
  removeComments: true,
  collapseWhitespace: true,
  removeAttributeQuotes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
};

module.exports = {
  html: (origin, config) => new Promise((resolve) => {
    try {
      if (config.cfg.minifyRemoveLineBreakWhitespace) {
        // eslint-disable-next-line no-param-reassign
        origin = origin.split('\n').map(e => e.trim()).join('');
      }

      const minified = minify(origin, options);
      resolve(minified);
    } catch (e) {
      resolve(origin);
    }
  }),
};
