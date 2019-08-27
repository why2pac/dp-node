/* global before, after */
/* eslint import/no-extraneous-dependencies: ["error", { "devDependencies": true }] */

module.exports = {
  init(options) {
    const opts = options || {};

    global.isTest = true;

    return (fn, app, title) => {
      const supertest = require('supertest');

      describe(title || 'WebServer', () => {
        let http;

        before((done) => {
          http = opts.isAppBind !== false && app.dp.listen();

          const engine = global.__dpModelEngine__;
          if (engine.destroyed) {
            engine.registerDsn(app.dp.config.cfg.databaseDsn);
            engine.destroyed = false;
          }

          if (http) {
            http.on('listening', () => {
              try {
                global.DP_TEST_PORT = http.address().port;
              } catch (e) {
                if (!e) {
                  const v = new Error(e);
                  v.reason = e;
                  done(v);
                } else {
                  done(e);
                }
                return;
              }
              done();
            });
          } else {
            done();
          }
        });

        after(() => {
          const modelEngine = global.__dpModelEngine__;
          if (modelEngine && modelEngine._conn) {
            const conns = modelEngine._conn;
            Object.keys(conns).forEach((key) => {
              conns[key].destroy();
              delete conns[key];
            });
          }

          const sessionEngine = global.__dpSessionEngine__;
          if (sessionEngine && sessionEngine.engine) {
            sessionEngine.engine().close();
          }

          const cachers = global.global.__dpCachers__;
          if (cachers) {
            Object.values(cachers).forEach((c) => c.close());
          }

          modelEngine.destroyed = true;

          if (http) http.close();
          http = undefined;
        });

        fn(opts.isAppBind === false ? supertest : (() => supertest(http)), app.dp.config, app);
      });
    };
  },
};
