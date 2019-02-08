'use strict';

const express = require('express');
const path = require('path');

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
|             secret: String, Session Secret, Default is dp provided value.
|             ttl: Integer, Time to alive for each session key-value, Default is 3600*24*30
|             volatility: Boolean, Whether if use session cookie or not, Default is false.
|             connection: Object, Options for Driver, Default is empty object({}).
|         }
|         cookie: {
|             secret: String, Cookie Secret, Default is dp provided value.
|             ttl: Integer, Time to alive for each cookie key-value, Default is 3600*24*30
|             volatility: Boolean, Whether if use session cookie or not, Default is false.
|         }
|     }
|*
*/
module.exports = (options) => {
  let { app } = options;
  const config = {};

  const defaultVal = (val, defVal) => (typeof val === 'undefined' ? defVal : val);
  const arrayToObj = (arr, key) => (Array.isArray(arr) ? arr.reduce((o, value) => (
    Object.defineProperty(o, value[key], { configurable: true, enumerable: true, value })
  ), {}) : arr);

  config.mode = (options.mode || 'web').toLowerCase();
  config.debug = defaultVal(options.debug, false);

  config.cfg = {};
  config.cfg.apppath = options.apppath;
  config.cfg.controller = options.apppath + (options.controllerPath || '/controller');
  config.cfg.view = options.apppath + (options.viewPath || '/view');
  config.cfg.minifyRemoveLineBreakWhitespace = defaultVal(
    options.minifyRemoveLineBreakWhitespace,
    true // eslint-disable-line comma-dangle
  );
  config.cfg.requestSizeLimit = options.requestSizeLimit || '0.5mb';
  config.cfg.errorLogging = defaultVal(options.errorLogging, true);

  config.handler = { error: undefined };

  if (typeof options.error === 'function') {
    const errorHandler = options.error;
    config.handler.error = (controller, error, statusCode) => (
      new Promise(resolve => resolve(errorHandler(controller, error, statusCode))).catch((e) => {
        console.error('Error while handling error:', e); // eslint-disable-line no-console

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
    app.use(require('morgan')('short', {})); // eslint-disable-line global-require
  }

  let redirectOpts = options.redirectNakedToWWW;
  if (redirectOpts) {
    if (typeof redirectOpts !== 'object' && typeof redirectOpts !== 'function') redirectOpts = {};
    app.use(require('express-naked-redirect')(redirectOpts)); // eslint-disable-line global-require
  }

  if (defaultVal(options.compression, true)) {
    app.use(require('compression')()); // eslint-disable-line global-require
  }

  if (defaultVal(options.enhanceSecurity, true)) {
    app.use(require('helmet')()); // eslint-disable-line global-require
  }

  if (defaultVal(options.cookieEnabled, true)) {
    app.use(require('cookie-parser')()); // eslint-disable-line global-require
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
    ns.secret = ns.secret || 'dR@9oNp0W@r~NoD2';
    ns.volatility = defaultVal(ns.volatility, false);
    ns.ttl = ns.ttl || 3600 * 24 * 30;
    ns.cookieName = ns.cookieName || 'DSESSIONID';
    ns.keyLength = ns.keyLength || 32;
    ns.signPrefix = ns.signPrefix || (options.cookie && options.cookie.signPrefix) || 's:';
    config.cfg.session = ns;
  }

  if (defaultVal(options.cookie, {})) {
    const ns = options.cookie || {};
    ns.secret = ns.secret || 'dR@9oNp0W@r~Co0K2';
    ns.volatility = defaultVal(ns.volatility, false);
    ns.ttl = ns.ttl || 3600 * 24 * 30;
    ns.signPrefix = ns.signPrefix || 's:';
    ns.keepOnVerifyFail = ns.keepOnVerifyFail || false;
    config.cfg.cookie = ns;
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
    (typeof paths === 'object' ? paths : [paths])
      .forEach(e => app.use(express.static(`${options.apppath}/${e}`)));
  }

  if (options.trustProxy) {
    app.enable('trust proxy', typeof options.trustProxy === 'boolean' ? undefined : options.trustProxy);
  }

  if (!global.isTest && options.port && config.mode !== 'job') {
    let listenOpts = options.port;
    if (!Array.isArray(listenOpts)) listenOpts = [listenOpts];

    const httpServer = app.listen(...listenOpts);
    if (options.logging) {
      httpServer.on('listening', () => {
        const boundAddr = httpServer.address();
        let addrRepr = boundAddr;
        if (boundAddr && boundAddr.family) {
          const { port, family, address } = boundAddr;
          switch (family) {
            case 'IPv4': addrRepr = `http://${address}:${port}/`; break;
            case 'IPv6': addrRepr = `http://[${address}]:${port}/`; break;
            default: break;
          }
        }
        console.log('Listening on', addrRepr); // eslint-disable-line no-console
      });
    }
  }

  config.view = require('./lib/view')(config); // eslint-disable-line global-require
  config.cache = require('./lib/cache')(config); // eslint-disable-line global-require
  config.router = require('./lib/router')(config); // eslint-disable-line global-require
  config.helper = require('./lib/helper')(config); // eslint-disable-line global-require
  config.model = require('./lib/model')(config); // eslint-disable-line global-require

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
    return require('./lib/job')(config); // eslint-disable-line global-require
  }

  app.dp = dp;
  return app;
};

module.exports.Tester = require('./lib/tester'); // eslint-disable-line global-require
