const { minify } = require('html-minifier');

const options = {
  removeComments: true,
  collapseWhitespace: true,
  removeAttributeQuotes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
};

module.exports = {
  html: async (origin, config) => {
    try {
      if (config.cfg.minifyRemoveLineBreakWhitespace) {
        // eslint-disable-next-line no-param-reassign
        origin = origin.split('\n').map(e => e.trim()).join('');
      }

      return minify(origin, options);
    } catch (e) {
      return origin;
    }
  },
};
