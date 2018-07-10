module.exports = function (hbs) {
  return function (str, options) {
    str = hbs.escapeExpression(str)
    var breakTag = options.hash && options.hash.isXhtml ? '<br />' : '<br>'
    var isReplace = !!(options.hash && options.hash.replace)
    var nl2br = str.replace(/(\r\n|\n\r|\r|\n)/g, isReplace ? breakTag : breakTag + '$1')
    return new hbs.SafeString(nl2br)
  }
}
