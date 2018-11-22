const pagination = require('./library/pagination');

module.exports = {
  handler: {
    serverError: (controller, req, res, config, err, statusCode) => {
      res.isDoNotUseFinishBuffer = true;

      if (statusCode !== 404 && config.cfg.errorLogging) {
        console.error('-------'); // eslint-disable-line no-console
        console.error('[ERROR]'); // eslint-disable-line no-console
        console.error('-------'); // eslint-disable-line no-console
        console.error(err); // eslint-disable-line no-console
        console.error('-------'); // eslint-disable-line no-console
      }

      if (typeof (config.handler.error) === 'function') {
        config.handler.error(controller, err, statusCode);
      } else {
        res.status(statusCode || 500).send('An error has occurred.');
      }
    },
  },
  delegate: (config, req, res, session, cookie) => {
    const controller = {
      raw: {
        req,
        res,
      },
      req: {
        url: () => `${req.protocol}://${req.get('host')}`,
        uri: () => `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      },
      remoteIp: () => req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      model: config.model,
      helper: config.helper,
      session: {
        id: renewOrSet => session.id(req, res, renewOrSet),
        set: (key, val, ttl) => session.set(req, res, key, val, ttl),
        get: (key, ttl) => session.get(req, res, key, ttl),
        del: key => session.del(req, res, key),
        ttl: key => session.ttl(req, res, key),
        expire: (key, ttl) => session.expire(req, res, key, ttl),
      },
      cookie: {
        get: key => cookie.get(req, res, key),
        set: (key, val, opts) => cookie.set(req, res, key, val, opts),
      },
      params: (key, url) => {
        if (url) {
          return req.params ? req.params[key] : null;
        }

        if (req.method === 'GET') {
          return req.query ? req.query[key] : null;
        }
        return req.body ? req.body[key] : null;
      },
      headers: key => req.get(key),
      redirect: (url, statusCode) => {
        if (typeof url === 'string' && typeof statusCode === 'number') {
          const temp = url;
          url = statusCode; // eslint-disable-line no-param-reassign
          statusCode = temp; // eslint-disable-line no-param-reassign
        }

        if (res.isDoNotUseFinishBuffer) {
          if (statusCode) {
            res.redirect(url, statusCode);
          } else {
            res.redirect(url);
          }
        } else {
          res.bufferRedirect = {
            url,
            code: statusCode || null,
          };
        }
      },
      finish: (body) => {
        controller.finishWithCode(200, body);
      },
      finisher: {
        notfound(body) {
          controller.finishWithCode(404, body);
        },
        invalid(body) {
          controller.finishWithCode(400, body);
        },
        unauthorized(body) {
          controller.finishWithCode(401, body);
        },
        denied(body) {
          controller.finishWithCode(403, body);
        },
        error(body) {
          controller.finishWithCode(500, body);
        },
      },
      finishWithCode: (code, body) => {
        if (!body) {
          if (code === 404) {
            body = 'Page not found.'; // eslint-disable-line no-param-reassign
          } else if (code === 403) {
            body = 'Forbidden.'; // eslint-disable-line no-param-reassign
          } else if (code === 400) {
            body = 'Invalid Request.'; // eslint-disable-line no-param-reassign
          } else if (code >= 500 && code < 600) {
            body = 'An error has occurred.'; // eslint-disable-line no-param-reassign
          }
        }

        if (res.isDoNotUseFinishBuffer) {
          res.status(code).send(body);
        } else {
          res.buffer = {
            code,
            body,
          };
        }
      },
      render: async (view, params, opts) => {
        const renderString = await config.view.render(view, params, opts);
        controller.finish(renderString);
      },
      renderString: async (view, params, opts) => {
        const rendered = await config.view.render(view, params, opts);
        return rendered;
      },
      pagination: (options, addOptions) => pagination(req, res, options, addOptions),
    };

    return controller;
  },
};
