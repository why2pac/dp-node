module.exports = {
  local: require('./db.local'),
  testAppveyor: require('./db.test.appveyor'),
  testTravis: require('./db.test.travis')
}
