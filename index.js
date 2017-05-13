global.async = require('asyncawait/async');
global.await = require('asyncawait/await');

const express = require('express');

/*
|* dp for Node
|*
|* @param {Object} [options] {
|         app: Object, Express App.
|         apppath: String, Application Absolute Path [Required]
|         controllerPath: String, View Path, Default is 'controller'
|         viewPath: String, View Path, Default is 'view'
|         port: Int, Binding port, If specified, will bind automatically.
|         debug: Boolean, Debug Mode, Default is false.
|         compression: Boolean, Compression, Default is true.
|         enhanceSecurity: Boolean, Security(Helmet), Default is true.
|         minifyRemoveLineBreakWhitespace: Boolean, Whether if remove line break whitespace or not, Default is true.
|         error: Function, Error Handler.
|         logging: Boolean, Logging enabled, Default is false.
|         static: [String], Static file paths.
|         redirectNakedToWWW: Boolean, Whether redirect naked domain to www  or not, Default is false.
|         databaseDsn: [Object], Pre-defined database dsn key as `key`, Default is empty.
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
    var app = options ? options.app : null;
    var config = {};

    var defaultVal = (val, defaultVal) => {
        if (val === undefined) {
            return defaultVal;
        }

        return val;
    }

    config.debug = defaultVal(options.debug, false);

    config.cfg = {};
    config.cfg.apppath = options.apppath;
    config.cfg.controller = options.apppath + ('/controller' || options.controllerPath);
    config.cfg.view = options.apppath + ('/view' || options.viewPath);
    config.cfg.minifyRemoveLineBreakWhitespace = defaultVal(options.minifyRemoveLineBreakWhitespace, true);

    config.handler = {};
    config.handler.error = options.error || undefined;

    config.cfg.viewHelpers = options.viewHelpers || {};

    if (!app) {
        app = express();
    }

    config.app = app;

    if (options.logging) {
        app.use(require('morgan')('short', {}));
    }

    if (defaultVal(options.redirectNakedToWWW, false)) {
        app.use(require('./lib/middleware/express-naked-redirect')());
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

    if (defaultVal(options.session, {})) {
        config.cfg.session = options.session || {};
        config.cfg.session.secret = config.cfg.session.secret || 'dR@9oNp0W@r~NoD2';
        config.cfg.session.volatility = defaultVal(config.cfg.session.volatility, false);
        config.cfg.session.ttl = config.cfg.session.ttl || 3600*24*30;
    }

    if (defaultVal(options.cookie, {})) {
        config.cfg.cookie = options.cookie || {};
        config.cfg.cookie.secret = config.cfg.cookie.secret || 'dR@9oNp0W@r~Co0K2';
        config.cfg.cookie.volatility = defaultVal(config.cfg.cookie.volatility, false);
        config.cfg.cookie.ttl = config.cfg.cookie.ttl || 3600*24*30;
    }

    if (defaultVal(options.databaseDsn, [])) {
        config.cfg.databaseDsn = options.databaseDsn;
    }

    app.use('/dp', express.static(__dirname + '/lib/static'));

    if (options.static) {
        var paths = options.static;

        if (typeof(paths) != 'object') {
            paths = [paths]
        }

        paths.forEach((e) => {
            app.use(express.static(options.apppath + '/' + e))
        })
    }

    const listen = (port) => {
        if (options.logging) {
            console.log('Listening .. ' + port);
        }

        return app.listen(port);
    }

    if (options.port) {
        listen(options.port);
    }

    config.view = require('./lib/view')(config);
    config.router = require('./lib/router')(config);
    config.helper = require('./lib/helper')(config);
    config.model = require('./lib/model')(config);

    return {
        app: app,
        listen: listen
    }
}
