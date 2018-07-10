const pagination = require('./library/pagination')

module.exports = {
  handler: {
    serverError: (controller, req, res, config, err, statusCode) => {
      res.isDoNotUseFinishBuffer = true

      if (statusCode !== 404 && config.cfg.errorLogging) {
        console.error('-------')
        console.error('[ERROR]')
        console.error('-------')
        console.error(err)
        console.error('-------')
      }

      if (typeof (config.handler.error) === 'function') {
        config.handler.error(controller, err, statusCode)
      } else {
        res.status(statusCode || 500).send('An error has occurred.')
      }
    }
  },
  delegate: (config, req, res, session, cookie) => {
    var controller = {
      raw: {
        req: req,
        res: res
      },
      req: {
        url: () => {
          return req.protocol + '://' + req.get('host')
        },
        uri: () => {
          return req.protocol + '://' + req.get('host') + req.originalUrl
        }
      },
      remoteIp: () => {
        return req.headers['x-forwarded-for'] || req.connection.remoteAddress
      },
      model: config.model,
      helper: config.helper,
      session: {
        id: (renewOrSet) => {
          return session.id(req, res, renewOrSet)
        },
        set: (key, val, ttl) => {
          return session.set(req, res, key, val, ttl)
        },
        get: (key, ttl) => {
          return session.get(req, res, key, ttl)
        },
        del: (key) => {
          return session.del(req, res, key)
        },
        ttl: (key) => {
          return session.ttl(req, res, key)
        },
        expire: (key, ttl) => {
          return session.expire(req, res, key, ttl)
        }
      },
      cookie: {
        get: (key) => {
          return cookie.get(req, res, key)
        },
        set: (key, val, opts) => {
          return cookie.set(req, res, key, val, opts)
        }
      },
      params: (key, url) => {
        if (url) {
          return req.params ? req.params[key] : null
        }

        if (req.method == 'GET') {
          return req.query ? req.query[key] : null
        } else {
          return req.body ? req.body[key] : null
        }
      },
      headers: (key) => {
        return req.get(key)
      },
      redirect: (url, statusCode) => {
        if (typeof url === 'string' && typeof statusCode === 'number') {
          var temp = url
          url = statusCode
          statusCode = temp
        }

        if (res.isDoNotUseFinishBuffer) {
          if (statusCode) {
            res.redirect(url, statusCode)
          } else {
            res.redirect(url)
          }
        } else {
          res.bufferRedirect = {
            url: url,
            code: statusCode || null
          }
        }
      },
      finish: (body) => {
        controller.finishWithCode(200, body)
      },
      finisher: {
        notfound: function (body) {
          controller.finishWithCode(404, body)
        },
        invalid: function (body) {
          controller.finishWithCode(400, body)
        },
        unauthorized: function (body) {
          controller.finishWithCode(401, body)
        },
        denied: function (body) {
          controller.finishWithCode(403, body)
        },
        error: function (body) {
          controller.finishWithCode(500, body)
        }
      },
      finishWithCode: (code, body) => {
        if (!body) {
          if (code == 404) {
            body = 'Page not found.'
          } else if (code == 403) {
            body = 'Forbidden.'
          } else if (code == 400) {
            body = 'Invalid Request.'
          } else if (code >= 500 < 600) {
            body = 'An error has occurred.'
          }
        }

        if (res.isDoNotUseFinishBuffer) {
          res.status(code).send(body)
        } else {
          res.buffer = {
            code: code,
            body: body
          }
        }
      },
      render: async (view, params, opts) => {
        var renderString = await config.view.render(view, params, opts)
        controller.finish(renderString)
      },
      renderString: async (view, params, opts) => {
        return await config.view.render(view, params, opts)
      },
      pagination: (options, addOptions) => {
        return pagination(req, res, options, addOptions)
      }
    }

    return controller
  }
}
