'use strict'

global.stage = 'local'

if (process.env.APPVEYOR) {
  global.stage = 'testAppveyor'
} else if (process.env.TRAVIS) {
  global.stage = 'testTravis'
}

var databaseDsn = require('./config/db')
var options = {
  apppath: __dirname,
  mode: global.mode || null,
  port: process.env.PORT || (global.isTest ? null : 7777),
  static: 'static',
  debug: global.optionDebug || true,
  logging: global.optionLogging || (!global.isTest),
  compression: global.optionCompression || false,
  redirectNakedToWWW: global.optionRedirectNakedToWWW || true,
  requestSizeLimit: global.optionsRequestSizeLimit || '1MB',
  viewHelpers: require('./helper'),
  session: {
    driver: 'redis',
    secret: 'session-secret-text',
    ttl: 3,
    volatility: true,
    connection: {
      host: '127.0.0.1'
    }
  },
  error: require('./error'),
  errorLogging: !global.isTest,
  cookie: {
    secret: 'cookie-secret-modify-this-value-in-production'
  },
  databaseDsn: Object.keys(databaseDsn).filter((e) => {
    return e.startsWith(global.stage)
  }).map((e) => { return databaseDsn[e] })
}

var dp = require('../../index')(options)
module.exports = dp
