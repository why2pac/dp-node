'use strict';

var options = {
    apppath: __dirname,
    port: process.env.PORT || (global.isTest ? null : 7777),
    static: 'static',
    debug: global.optionDebug || true,
    logging: global.optionLogging || (global.isTest ? false : true),
    compression: global.optionCompression || false,
    redirectNakedToWWW: global.optionRedirectNakedToWWW || true,
    requestSizeLimit: global.optionsRequestSizeLimit || '1MB',
    viewHelpers: require('./helper'),
    session: undefined,
    error: require('./error'),
    errorLogging: global.isTest ? false : true,
    cookie: {
      secret: 'cookie-secret-modify-this-value-in-production'
    },
    databaseDsn: null
};

var dp = require('../../index')(options);
module.exports = dp;
