module.exports = {
  init: function() {
    global.isTest = true;

    return (fn, dp) => {
      const request = require('supertest');
      var port;

      try {
        port = require('find-port-sync')();
      }
      catch (_) {
        port = 62369;
      }

      describe('WebServer', () => {
        var app = undefined;

        before(() => {
          app = dp.listen(port);
        });

        after(() => {
          if (global.__dpModelEngine__ && global.__dpModelEngine__._conn) {
            Object.keys(global.__dpModelEngine__._conn).forEach((key) => {
              global.__dpModelEngine__._conn[key].destroy();
            });
          }

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
