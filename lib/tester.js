module.exports = {
  init: function() {
    global.isTest = true;

    return (fn, app, title) => {
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
        var http = undefined;

        before(() => {
          http = app.dp.listen(port);

          if (global.__dpModelEngine__.destroyed) {
            global.__dpModelEngine__.registerDsn(app.dp.config.cfg.databaseDsn);
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

          if (global.__dpSessionEngine__ && global.__dpSessionEngine__.engine) {
            global.__dpSessionEngine__.engine().close();
          }

          global.__dpModelEngine__.destroyed = true;

          http.close();
          http = undefined;
        });

        fn(() => {
          return request(http);
        });
      });
    }
  }
};
