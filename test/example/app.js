global.stage = 'local';

if (process.env.APPVEYOR) {
  global.stage = 'testAppveyor';
} else if (process.env.TRAVIS) {
  global.stage = 'testTravis';
}

const databaseDsn = require('./config/db');
const cacheDsn = require('./config/cache');
const error = require('./error');
const viewHelpers = require('./helper');

const options = {
  apppath: __dirname,
  mode: global.mode || null,
  port: process.env.PORT || 7777,
  static: 'static',
  debug: global.optionDebug || true,
  logging: global.optionLogging || (!global.isTest),
  compression: global.optionCompression || false,
  redirectNakedToWWW: global.optionRedirectNakedToWWW || true,
  requestSizeLimit: global.optionsRequestSizeLimit || '1MB',
  trustProxy: false,
  viewHelpers,
  session: {
    driver: 'redis',
    secret: 'session-secret-text',
    ttl: 3,
    volatility: true,
    connection: {
      host: '127.0.0.1',
    },
  },
  error,
  errorLogging: !global.isTest,
  cookie: {
    secret: 'cookie-secret-modify-this-value-in-production',
  },
  cacheDsn,
  databaseDsn: Object.keys(databaseDsn)
    .filter(e => e.startsWith(global.stage))
    .map(e => databaseDsn[e]),
};

const dp = require('../../index')(options);

module.exports = dp;
