'use strict';

const express = require('express');
const path = require('path');
const viewLib = require('./lib/view');
const cacheLib = require('./lib/cache');
const routerLib = require('./lib/router');
const helperLib = require('./lib/helper');
const modelLib = require('./lib/model');
const Signer = require('./lib/signer');

/*
|* dp for Node
|*
|* @param {Object} [options] {
|         app: Object, Express App.
|         trustProxy: Booelan, trust proxy, Default is null.
|         apppath: String, Application Absolute Path [Required]
|         controllerPath: String, View Path, Default is 'controller'
|         viewPath: String, View Path, Default is 'view'
|         port: Int, Binding port, If specified, will bind automatically.
|         debug: Boolean, Debug Mode, Default is false.
|         preMiddlewares: Object, Pre middlewares, Default is null.
|         compression: Boolean, Compression, Default is true.
|         enhanceSecurity: Boolean, Security(Helmet), Default is true.
|         minifyRemoveLineBreakWhitespace: Boolean,
|           Whether if remove line break whitespace or not, Default is true.
|         requestSizeLimit: Numeric, Limit size of the request.
|         error: Function, Error Handler.
|         errorLogging: Boolean, Error Logging enabled, Default is true.
|         logging: Boolean, Logging enabled, Default is false.
|         static: [String], Static file paths.
|         redirectNakedToWWW: Boolean or Object,
|           Whether redirect naked domain to www or not, Default is false.
|         cacheDsn: ([)Object(]), Pre-defined cache dsns, Default is empty.
|         databaseDsn: [Object], Pre-defined database dsn key as `key`, Default is empty.
|         mode: String, Supported values are `web` or `job`, Default is `web`.
|         session: {
|             driver: String, ENUM('redis'), Session Driver, Default is undefined, disabled.
|             algorithm: String, Hash algorithm for signing Session IDs, Default is 'sha256'.
|             secret: String, Session secret key for signing, Default is dp provided value.
|             signPrefix: String, Prefix for all signed Session IDs, Default is cookie.signPrefix.
|             ttl: Int?, Time-to-live for cookies or null for session, Default is 3600*24*30.
|             volatility: Boolean, Whether if use session cookie or not, Default is false.
|             connection: Object, Options for Driver, Default is empty object({}).
|         }
|         cookie: {
|             algorithm: String, Hash algorithm for signing cookies, Default is 'sha256'.
|             secret: String, Cookie secret key for signing, Default is dp provided value.
|             signPrefix: String, Prefix for all signed cookies, Default is 's:'.
|             ttl: Int?, Time-to-live for cookies or null for session, Default is 3600*24*30.
|         }
|     }
|*
*/
module.exports = (options) => {
  let { app } = options;
  const config = {};

  const defaultVal = (val, defVal) => (typeof val === 'undefined' ? defVal : val);
  const arrayToObj = (arr, key) => (Array.isArray(arr) ? arr.reduce((o, value) => (
    Object.defineProperty(o, value[key], {
      value, writable: true, enumerable: true, configurable: true,
    })
  ), {}) : arr);

  config.mode = (options.mode || 'web').toLowerCase();
  config.debug = defaultVal(options.debug, false);

  config.cfg = {};
  config.cfg.apppath = options.apppath;
  config.cfg.controller = options.apppath + (options.controllerPath || '/controller');
  config.cfg.view = options.apppath + (options.viewPath || '/view');
  config.cfg.minifyRemoveLineBreakWhitespace = defaultVal(
    options.minifyRemoveLineBreakWhitespace,
    true
  );
  config.cfg.requestSizeLimit = options.requestSizeLimit || '0.5mb';
  config.cfg.errorLogging = defaultVal(options.errorLogging, true);

  config.handler = { error: undefined };

  if (typeof options.error === 'function') {
    const errorHandler = options.error;
    config.handler.error = (controller, error, statusCode) => (
      new Promise((resolve) => resolve(errorHandler(controller, error, statusCode))).catch((e) => {
        console.error('Error while handling error:', e);

        if (controller && controller.finisher) {
          controller.finisher.error('An error has occurred.');
        }

        return false;
      })
    );
  }

  config.cfg.viewHelpers = options.viewHelpers || {};

  if (!app) app = express();
  config.app = app;

  if (options.logging) {
    app.use(require('morgan')('short', {}));
  }

  let redirectOpts = options.redirectNakedToWWW;
  if (redirectOpts) {
    if (typeof redirectOpts !== 'object' && typeof redirectOpts !== 'function') redirectOpts = {};
    app.use(require('express-naked-redirect')(redirectOpts));
  }

  if (defaultVal(options.compression, true)) {
    app.use(require('compression')());
  }

  if (defaultVal(options.enhanceSecurity, true)) {
    app.use(require('helmet')());
  }

  if (defaultVal(options.cookieEnabled, true)) {
    app.use(require('cookie-parser')());
  }

  if (options.preMiddlewares) {
    let { preMiddlewares } = options;
    if (!Array.isArray(preMiddlewares)) preMiddlewares = [preMiddlewares];

    for (let i = 0; i < preMiddlewares.length; i += 1) {
      app.use(preMiddlewares[i]);
    }
  }

  if (defaultVal(options.session, {})) {
    const ns = options.session || {};
    let isSessionCookie = ns.volatility;
    if (typeof isSessionCookie !== 'undefined') {
      console.warn('dp-node: options.session.volatility is deprecated. Use options.session.ttl = null instead.');
    } else {
      isSessionCookie = ns.ttl === null;
    }
    config.cfg.session = {
      driver: ns.driver || 'stub',
      connection: ns.connection,
      ttlMs: isSessionCookie ? null : (ns.ttl || 3600 * 24 * 30) * 1e3,
      cookieName: ns.cookieName || 'DSESSIONID',
      keyLength: ns.keyLength || 32,
      signer: new Signer(
        ns.algorithm || 'sha256',
        ns.secret || 'dR@9oNp0W@r~NoD2',
        ns.signPrefix || (options.cookie && options.cookie.signPrefix) || 's:'
      ),
    };
  }

  if (defaultVal(options.cookie, {})) {
    const ns = options.cookie || {};
    let isSessionCookie = ns.volatility;
    if (typeof isSessionCookie !== 'undefined') {
      console.warn('dp-node: options.cookie.volatility is deprecated. Use options.cookie.ttl = null instead.');
    } else {
      isSessionCookie = ns.ttl === null;
    }
    config.cfg.cookie = {
      ttlMs: isSessionCookie ? null : (ns.ttl || 3600 * 24 * 30) * 1e3,
      signer: new Signer(
        ns.algorithm || 'sha256',
        ns.secret || 'dR@9oNp0W@r~Co0K2',
        ns.signPrefix || 's:'
      ),
    };
  }

  if (defaultVal(options.cacheDsn, {})) {
    config.cfg.cacheDsn = arrayToObj(options.cacheDsn, 'key') || {};
  }

  if (defaultVal(options.databaseDsn, [])) {
    config.cfg.databaseDsn = options.databaseDsn || [];
  }

  if (!options.suppressDefaultStaticFiles) {
    app.use('/dp', express.static(path.resolve(__dirname, '/lib/static')));
  }

  if (options.static) {
    const paths = options.static;
    (Array.isArray(paths) ? paths : [paths])
      .forEach((e) => app.use(express.static(`${options.apppath}/${e}`)));
  }

  if (options.trustProxy) {
    app.enable('trust proxy', typeof options.trustProxy === 'boolean' ? undefined : options.trustProxy);
  }

  if (!global.isTest && options.port != null && config.mode !== 'job') {
    let listenOpts = options.port;
    if (!Array.isArray(listenOpts)) listenOpts = [listenOpts];

    app.server = app.listen(...listenOpts);
    if (options.logging) {
      app.server.on('listening', () => {
        const boundAddr = app.server.address();
        let addrRepr;
        switch (boundAddr && boundAddr.family) {
          case 'IPv4': addrRepr = `http://${boundAddr.address}:${boundAddr.port}/`; break;
          case 'IPv6': addrRepr = `http://[${boundAddr.address}]:${boundAddr.port}/`; break;
          default: addrRepr = boundAddr; break;
        }
        console.log('Listening on', addrRepr);
      });
    }
  }

  config.view = viewLib(config);
  config.cache = cacheLib(config);
  config.router = routerLib(config);
  config.helper = helperLib(config);
  config.model = modelLib(config);

  const dp = {
    app,
    listen: app.listen.bind(app),
  };

  // Assign config when test mode enabled.
  if (global.isTest) {
    dp.config = config;
  }

  // for Job mode.
  if (config.mode === 'job') {
    return require('./lib/job')(config);
  }

  app.dp = dp;
  return app;
};

module.exports.Tester = require('./lib/tester');
