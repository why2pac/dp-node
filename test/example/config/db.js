'use strict';

const local = require('./db.local');
const localOpt = require('./db.local.opt');
const testAppveyor = require('./db.test.appveyor');
const testAppveyorOpt = require('./db.test.appveyor.opt');
const testTravis = require('./db.test.travis');
const testTravisOpt = require('./db.test.travis.opt');

module.exports = {
  local,
  localOpt,
  testAppveyor,
  testAppveyorOpt,
  testTravis,
  testTravisOpt,
};
