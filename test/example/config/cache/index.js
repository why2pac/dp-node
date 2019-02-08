'use strict';

const local = require('./local');
const localOpt = require('./local.opt');
const testAppveyor = require('./test.appveyor');
const testTravis = require('./test.travis');
const nine = require('./nine');
const mem = require('./mem');

module.exports = {
  local,
  localOpt,
  testAppveyor,
  testTravis,
  nine,
  mem,
};
