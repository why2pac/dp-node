module.exports = (fn) => {
  const request = require('supertest');
  const findPortSync = require('find-port-sync');
  const port = findPortSync();

  describe('WebServer', () => {
    var app = undefined;
    global.isTest = true;

    before(() => {
      var dp = require('./example/app');
      app = dp.listen(port);
    });

    after(() => {
      app.close();
      app = undefined;
    });

    fn(() => {
      return request(app);
    });
  });
}
