const signature = require('cookie-signature')

module.exports = (config) => {
  return {
    set: (req, res, key, val, opts) => {
      opts = opts || {}
      var signed = 's:' + signature.sign(val || '', config.cfg.cookie.secret)

      if (opts.expires === undefined) {
        opts.expires = config.cfg.cookie.volatility ? 0 : new Date(Date.now() + (config.cfg.cookie.ttl * 1000))
      }

      opts.sameSite = true

      res.cookie(key, signed, opts)

      return true
    },
    get: (req, res, key) => {
      if (req.cookies[key]) {
        try {
          var val = req.cookies[key]
          if (val.slice(0, 2) !== 's:') return val
          return signature.unsign(val.slice(2), config.cfg.cookie.secret)
        } catch (_) {}
      }
      return null
    }
  }
}
