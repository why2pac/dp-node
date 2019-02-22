'use strict';

module.exports = function nl2br(hbs) {
  return function nl2brInner(str, options) {
    str = hbs.escapeExpression(str); // eslint-disable-line no-param-reassign
    const breakTag = options.hash && options.hash.isXhtml ? '<br />' : '<br>';
    const isReplace = !!(options.hash && options.hash.replace);
    const replaced = str.replace(/\r?\n|\r/g, isReplace ? breakTag : `${breakTag}$&`);
    return new hbs.SafeString(replaced);
  };
};
