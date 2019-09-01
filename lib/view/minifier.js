'use strict';

const { minify } = require('html-minifier');

const options = {
  removeComments: true,
  collapseWhitespace: true,
  removeAttributeQuotes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
};

const LINESEP_SPACES_RE = /^\s+|\s*[\r\n]\s*|\s+$/g;

module.exports = {
  html: async (origin, config) => {
    let value = origin;
    try {
      // FIXME does not work for inline <script>s
      if (config.cfg.minifyRemoveLineBreakWhitespace) {
        value = value.replace(LINESEP_SPACES_RE, '');
      }

      value = minify(value, options);
    } catch (e) {
      // let unminified markups pass
    }
    return value;
  },
};
