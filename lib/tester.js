/* eslint-disable no-underscore-dangle */

module.exports = {
  init() {
    global.isTest = true;

    return (fn, app, title) => {
      const request = require('supertest'); // eslint-disable-line

      describe(title || 'WebServer', () => {
        let http;

        before(() => new Promise((resolve) => { // eslint-disable-line no-undef
          http = app.dp.listen();

          const engine = global.__dpModelEngine__;
          if (engine.destroyed) {
            engine.registerDsn(app.dp.config.cfg.databaseDsn);
            engine.destroyed = false;
          }

          http.on('listening', () => {
            global.DP_TEST_PORT = http.address().port;
            resolve(undefined);
          });
        }));

        after(() => { // eslint-disable-line no-undef
          const modelEngine = global.__dpModelEngine__;
          if (modelEngine && modelEngine._conn) {
            Object.keys(modelEngine._conn).forEach((key) => {
              modelEngine._conn[key].destroy();
              delete modelEngine._conn[key];
            });
          }

          const sessionEngine = global.__dpSessionEngine__;
          if (sessionEngine && sessionEngine.engine) {
            sessionEngine.engine().close();
          }

          modelEngine.destroyed = true;

          http.close();
          http = undefined;
        });

        fn(() => request(http), app.dp.config, app);
      });
    };
  },
};
