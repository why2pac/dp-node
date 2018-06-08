module.exports = {
  init: function() {
    global.isTest = true;

    return (fn, dp, title) => {
      const request = require('supertest');
      var port;

      try {
        port = require('find-port-sync')();
      }
      catch (_) {
        port = 62369;
      }

      global.DP_TEST_PORT = port;

      describe(title || 'WebServer', () => {
        var app = undefined;

        before(() => {
          app = dp.listen(port);

          if (global.__dpModelEngine__.destroyed) {
            global.__dpModelEngine__.registerDsn(dp.config.cfg.databaseDsn);
            global.__dpModelEngine__.destroyed = false;
          }
        });

        after(() => {
          if (global.__dpModelEngine__ && global.__dpModelEngine__._conn) {
            Object.keys(global.__dpModelEngine__._conn).forEach((key) => {
              global.__dpModelEngine__._conn[key].destroy();
              delete global.__dpModelEngine__._conn[key];
            });
          }

          global.__dpSessionEngine__.engine().close();
          global.__dpModelEngine__.destroyed = true;

          app.close();
          app = undefined;
        });

        fn(() => {
          return request(app);
        });
      });
    }
  }
};
