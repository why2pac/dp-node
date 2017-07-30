const pagination = require('./library/pagination');

module.exports = {
  handler: {
    serverError: (controller, req, res, override, err) => {
      console.error('-------');
      console.error('[ERROR]');
      console.error('-------');
      console.error(err);
      console.error('-------');

      if (override) {
        override(controller, err);
      }
      else {
        res.status(500).send('An error has occurred.');
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
          return req.protocol + '://' + req.get('host');
        },
        uri: () => {
          return req.protocol + '://' + req.get('host') + req.originalUrl;
        }
      },
      model: config.model,
      helper: config.helper,
      session: {
        id: (renewOrSet) => {
          return session.id(req, res, renewOrSet);
        },
        set: (key, val, ttl) => {
          return session.set(req, res, key, val, ttl);
        },
        get: (key, ttl) => {
          return session.get(req, res, key, ttl);
        },
        del: (key) => {
          return session.del(req, res, key);
        },
        ttl: (key) => {
          return session.ttl(req, res, key);
        },
        expire: (key, ttl) => {
          return session.expire(req, res, key, ttl);
        }
      },
      cookie: {
        get: (key) => {
        return cookie.get(req, res, key);
        },
        set: (key, val, opts) => {
        return cookie.set(req, res, key, val, opts);
        }
      },
      params: (key, url) => {
        if (url) {
          return req.params[key];
        }

        if (req.method == 'GET') {
          return req.query[key]
        }
        else {
          return req.body[key]
        }
      },
      headers: (key) => {
        return req.get(key)
      },
      redirect: (url, statusCode) => {
        if (statusCode) {
          res.redirect(url, statusCode)
        }
        else {
          res.redirect(url)
        }
      },
      finish: (body) => {
        controller.finishWithCode(200, body)
      },
      finisher: {
        notfound: function(body) {
          controller.finishWithCode(404, body)
        },
        invalid: function(body) {
          controller.finishWithCode(400, body)
        },
        denied: function(body) {
          controller.finishWithCode(403, body)
        },
        error: function(body) {
          controller.finishWithCode(500, body)
        }
      },
      finishWithCode: (code, body) => {
        if (!body) {
          if (code == 404) {
            body = 'Page not found.'
          }
          else if (code == 403) {
            body = 'Forbidden.'
          }
          else if (code == 400) {
            body = 'Invalid Request.'
          }
          else if (500 <= code < 600) {
            body = 'An error has occurred.'
          }
        }

        res.status(code).send(body)
      },
      render: (view, params) => {
        var renderString = await(config.view.render(req, res, view, params));
        controller.finish(renderString);
      },
      renderString: (view, params) => {
        return await(config.view.render(req, res, view, params));
      },
      pagination: (options, addOptions) => {
        return pagination(req, res, options, addOptions);
      }
    }

    return controller;
  }
}
