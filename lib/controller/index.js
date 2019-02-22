'use strict';

const pagination = require('./library/pagination');

const symPrivate = Symbol('dp-node.private');
class Finisher {
  constructor(controller) {
    this[symPrivate] = controller;
  }

  notfound(body) {
    return this[symPrivate].finishWithCode(404, body);
  }

  invalid(body) {
    return this[symPrivate].finishWithCode(400, body);
  }

  unauthorized(body) {
    return this[symPrivate].finishWithCode(401, body);
  }

  denied(body) {
    return this[symPrivate].finishWithCode(403, body);
  }

  error(body) {
    return this[symPrivate].finishWithCode(500, body);
  }
}

class RequestInfo {
  constructor(req) {
    this[symPrivate] = req;
  }

  url() {
    const req = this[symPrivate];
    return `${req.protocol}://${req.get('host')}`;
  }

  uri() {
    const req = this[symPrivate];
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  }
}

class Controller {
  constructor(config, req, res, session, cookie) {
    this.raw = { req, res };
    this.req = new RequestInfo(req);
    this.cache = config.cache;
    this.model = config.model;
    this.helper = config.helper;
    this.session = {
      id: session.id.bind(session, req, res),
      set: session.set.bind(session, req, res),
      get: session.get.bind(session, req, res),
      del: session.del.bind(session, req, res),
      ttl: session.ttl.bind(session, req, res),
      expire: session.expire.bind(session, req, res),
    };
    this.cookie = {
      get: cookie.get.bind(cookie, req, res),
      set: cookie.set.bind(cookie, req, res),
    };
    this.finisher = new Finisher(this);
    this.render = (view, params, opts) => (
      Promise.resolve(config.view.render(view, params, opts)).then(s => this.finish(s)));
    this.renderString = (view, params, opts) => (
      Promise.resolve(config.view.render(view, params, opts)));
  }

  remoteIp(all) {
    const { req } = this.raw;
    return all ? req.ips : req.ip;
  }

  params(key, url) {
    const { req } = this.raw;
    if (url) {
      return req.params ? req.params[key] : null;
    }

    if (req.method === 'GET') {
      return req.query ? req.query[key] : null;
    }
    return req.body ? req.body[key] : null;
  }

  headers(key) {
    return this.raw.req.get(key);
  }

  redirect(url, statusCode) {
    if (typeof url === 'string' && typeof statusCode === 'number') {
      const temp = url;
      url = statusCode; // eslint-disable-line no-param-reassign
      statusCode = temp; // eslint-disable-line no-param-reassign
    }

    const { res } = this.raw;
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
  }

  finish(body) {
    return this.finishWithCode(200, body);
  }

  finishWithCode(code, body) {
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

    const { res } = this.raw;
    if (res.isDoNotUseFinishBuffer) {
      res.status(code).send(body);
    } else {
      res.buffer = { code, body };
    }
  }

  pagination(options, addOptions) {
    const { req, res } = this.raw;
    return pagination(req, res, options, addOptions);
  }
}

module.exports = {
  handler: {
    serverError: (controller, req, res, config, err, statusCode) => {
      res.isDoNotUseFinishBuffer = true;

      if (statusCode !== 404 && config.cfg.errorLogging) {
        console.error('-------');
        console.error('[ERROR]');
        console.error('-------');
        console.error(err);
        console.error('-------');
      }

      const { handler } = config;
      if (typeof handler.error === 'function') {
        handler.error(controller, err, statusCode);
      } else {
        res.status(statusCode || 500).send('An error has occurred.');
      }
    },
  },
  delegate: (config, req, res, session, cookie) => (
    new Controller(config, req, res, session, cookie)),
};
