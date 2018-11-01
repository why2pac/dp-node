module.exports = {
  local: require('./db.local'),
  localOpt: require('./db.local.opt'),
  testAppveyor: require('./db.test.appveyor'),
  testAppveyorOpt: require('./db.test.appveyor.opt'),
  testTravis: require('./db.test.travis'),
  testTravisOpt: require('./db.test.travis.opt')
}
