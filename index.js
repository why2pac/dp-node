global.async = require('asyncawait/async');
global.await = require('asyncawait/await');

const express = require('express');

/*
|* dp for Node
|*
|* @param {Object} [options] {
|         app: Object, Express App.
|         apppath: String, Application Absolute Path [Required]
|         port: Int, Binding port, If specified, will bind automatically.
|         debug: Boolean, Debug Mode, Default is false.
|         compression: Boolean, Compression, Default is true.
|         enhanceSecurity: Boolean, Security(Helmet), Default is true.
|         minifyRemoveLineBreakWhitespace: Boolean, Whether if remove line break whitespace or not, Default is true.
|         error: Function, Error Handler.
|         logging: Boolean, Logging enabled, Default is false.
|         static: [String], Static file paths.
|         redirectNakedToWWW: Boolean, Whether redirect naked domain to www  or not, Default is false.
|       }
|*
*/
module.exports = (options) => {
    var app = options ? options.app : null;
    var config = {};

    var defaultVal = (val, defaultVal) => {
        if (val == undefined) {
            return defaultVal;
        }

        return val;
    }

    config.debug = defaultVal(options.debug, false);

    config.cfg = {};
    config.cfg.apppath = options.apppath;
    config.cfg.controller = options.apppath + '/controller';
    config.cfg.view = options.apppath + '/view';
    config.cfg.minifyRemoveLineBreakWhitespace = defaultVal(options.minifyRemoveLineBreakWhitespace, true);

    config.delegate = {};
    config.delegate.error = options.error || undefined;

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
        console.log('Listening .. ' + port);
        app.listen(port);
    }

    if (options.port) {
        listen(options.port);
    }

    config.view = require('./lib/view')(config);
    config.router = require('./lib/router')(config);
    config.model = require('./lib/model')(config);

    return {
        app: app,
        listen: listen
    }
}
