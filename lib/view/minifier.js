const { minify } = require('html-minifier');

const options = {
  removeComments: true,
  collapseWhitespace: true,
  removeAttributeQuotes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
};

const LINESEP_SPACES_RE = /\s*(?:\n|^|$)\s*/g;

module.exports = {
  html: async (origin, config) => {
    try {
      let value = origin;
      if (config.cfg.minifyRemoveLineBreakWhitespace) {
        value = value.replace(LINESEP_SPACES_RE, '');
      }

      return minify(value, options);
    } catch (e) {
      return origin;
    }
  },
};
