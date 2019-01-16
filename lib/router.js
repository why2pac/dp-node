const createHttpError = require('http-errors');
const bodyParser = require('body-parser');
const url = require('url');
const ini = require('ini');
const fs = require('fs');
const dpError = require('./misc/dp_error');
const controller = require('./controller');
const sessionLib = require('./controller/library/session');
const cookieLib = require('./controller/library/cookie');
const isArrowFunction = require('./functions').isArrowFunction; // eslint-disable-line prefer-destructuring

const isArrowFunctions = {};

module.exports = (config) => {
  const session = sessionLib(config);
  const cookie = cookieLib(config);

  const bodyParserUrlEncodedOpts = { extended: true };

  if (config.cfg.requestSizeLimit !== undefined) {
    bodyParserUrlEncodedOpts.limit = config.cfg.requestSizeLimit;
  }

  // Assign engine when test mode enabled.
  if (global.isTest) {
    global.__dpSessionEngine__ = session; // eslint-disable-line no-underscore-dangle
  }

  const bodyParserUrlEncoded = bodyParser.urlencoded(bodyParserUrlEncodedOpts);

  const handler = async (delegate, req, res, data) => {
    const ctrl = controller.delegate(config, req, res, session, cookie);
    let isThisArrowFunction = isArrowFunctions[delegate];
    let hdl;

    if (isThisArrowFunction === undefined) {
      // eslint-disable-next-line no-multi-assign
      isThisArrowFunction = isArrowFunctions[delegate] = isArrowFunction(delegate);
    }

    if (isThisArrowFunction) {
      hdl = await delegate.bind(ctrl)(ctrl, data);
    } else {
      hdl = await delegate.bind(ctrl)(data);
    }

    return hdl;
  };

  const finalizeMiddleware = (req, res, next) => { // eslint-disable-line no-unused-vars
    if (res.bufferRedirect) {
      if (res.bufferRedirect.code) {
        res.redirect(res.bufferRedirect.url, res.bufferRedirect.code);
      } else {
        res.redirect(res.bufferRedirect.url);
      }
    } else if (res.buffer && res.buffer.body === undefined) {
      res.status(204).send();
    } else if (res.buffer) {
      res.status(res.buffer.code).send(res.buffer.body);
    } else {
      res.status(204).send();
    }
  };

  const delegates = {
    route: (
      method,
      path,
      delegate,
      middlewares,
      middlewaresEnd,
      controllerPrefix,
      controllerSuffix,
      controllerErrorHandler // eslint-disable-line comma-dangle
    ) => {
      const params = [path];
      let fn;

      if (method === 'get') {
        fn = config.app.get;
      } else if (method === 'post') {
        fn = config.app.post;
        params.push(bodyParserUrlEncoded);
      } else if (method === 'delete') {
        fn = config.app.delete;
        params.push(bodyParserUrlEncoded);
      } else if (method === 'put') {
        fn = config.app.put;
        params.push(bodyParserUrlEncoded);
      }

      // Add middlewares
      if ((middlewares && typeof (middlewares) === 'object')
          || (middlewaresEnd && typeof (middlewaresEnd) === 'object')) {
        params.push((req, res, next) => {
          const dp = async (callback) => {
            const ctrl = controller.delegate(config, req, res, session, cookie);
            const handlerObj = {
              controller: ctrl,
              helper: config.helper,
              model: config.model,
            };

            try {
              await (callback(handlerObj));
            } catch (err) {
              controller.handler.serverError(ctrl, req, res, config, new dpError(err, req), 500) // eslint-disable-line
            }
          };

          req.async = dp;
          res.async = dp;

          next();
        });
      }

      // Add middlewares
      if (middlewares && typeof (middlewares) === 'object') {
        middlewares.forEach((middleware) => {
          params.push(middleware);
        });
      }

      const isAvailableMiddlewaresForEnd = middlewaresEnd && typeof (middlewaresEnd) === 'object';

      const resPrev = {};

      const finalizeController = (req, res, next, done, resKey, error) => {
        done.then((resp) => {
          if (typeof (res.buffer) === 'undefined' && resp) {
            if (resKey) {
              resPrev[resKey] = resp;
            } else {
              res.buffer = {
                code: error ? 500 : 200,
                body: resp,
              };
            }
          } else if (resp === true && isAvailableMiddlewaresForEnd) {
            finalizeMiddleware(req, res);
            return;
          }

          next();
        }).catch((err) => {
          if (controllerErrorHandler && !error) {
            next(err);
            return;
          }

          const ctrl = controller.delegate(config, req, res, session, cookie);
          controller.handler.serverError(ctrl, req, res, config, new dpError(err, req), 500) // eslint-disable-line
        });
      };

      if (controllerPrefix) {
        params.push((req, res, next) => {
          const done = handler(controllerPrefix, req, res);
          finalizeController(req, res, next, done, 'prefix');
        });
      }

      // Add action
      params.push((req, res, next) => {
        const done = handler(delegate, req, res, resPrev.prefix);
        finalizeController(req, res, next, done, controllerSuffix ? 'body' : null);
      });

      if (controllerSuffix) {
        params.push((req, res, next) => {
          const done = handler(controllerSuffix, req, res, resPrev.body);
          finalizeController(req, res, next, done);
        });
      }

      // Add middlewares for end
      if (isAvailableMiddlewaresForEnd) {
        middlewaresEnd.forEach((middleware) => {
          params.push(middleware);
        });
      }

      // Error handling on controller
      if (controllerErrorHandler) {
        params.push((err, req, res, next) => {
          const done = handler(controllerErrorHandler, req, res, err);
          finalizeController(req, res, next, done, null, true);
        });
      }

      params.push(finalizeMiddleware);

      // Error handling globally.
      params.push((err, req, res, next) => { // eslint-disable-line no-unused-vars
        const ctrl = controller.delegate(config, req, res, session, cookie);
        controller.handler.serverError(ctrl, req, res, config, new dpError(err, req), 500) // eslint-disable-line
      });

      if (fn) {
        fn.apply(config.app, params);
      }
    },
  };

  if (config.cfg.controller) {
    const trees = [];
    const configs = [];
    const globalMiddlewaresFirst = [];
    const globalMiddlewaresEnd = [];
    const globalControllerFirst = [];
    const globalControllerEnd = [];
    const globalErrorHandler = [];

    const findConfig = (path) => {
      for (let i = 0; i < configs.length; i += 1) {
        if (path.indexOf(configs[i][0]) === 0) {
          return configs[i][1];
        }
      }

      return null;
    };

    const findMiddleware = (path, isFirst) => {
      let middlewares;

      if (isFirst) {
        middlewares = globalMiddlewaresFirst;
      } else {
        middlewares = globalMiddlewaresEnd;
      }

      for (let i = 0; i < middlewares.length; i += 1) {
        if (path.indexOf(middlewares[i][0]) === 0
            && (path === middlewares[i][0]
             || path.slice(middlewares[i][0].length, middlewares[i][0].length + 1) === '/')) {
          return middlewares[i][1];
        }
      }

      return null;
    };

    const findController = (path, isFirst) => {
      let controllers;

      if (isFirst) {
        controllers = globalControllerFirst;
      } else {
        controllers = globalControllerEnd;
      }

      for (let i = 0; i < controllers.length; i += 1) {
        if (path.indexOf(controllers[i][0]) === 0
            && (path === controllers[i][0]
             || path.slice(controllers[i][0].length, controllers[i][0].length + 1) === '/')) {
          return controllers[i][1];
        }
      }

      return null;
    };

    const findErrorHandler = (path, isFirst) => { // eslint-disable-line no-unused-vars
      for (let i = 0; i < globalErrorHandler.length; i += 1) {
        if (path.indexOf(globalErrorHandler[i][0]) === 0
            && (path === globalErrorHandler[i][0]
             || path.slice(globalErrorHandler[i][0].length, globalErrorHandler[i][0].length + 1) === '/')) {
          return globalErrorHandler[i][1];
        }
      }

      return null;
    };

    const includePreapre = (path, filePath, configParam) => {
      if (!fs.statSync(filePath).isFile()) {
        return false;
      }

      // Middleware for begin
      if (filePath.lastIndexOf('/_.') === filePath.length - 5) {
        const middleware = require(filePath); // eslint-disable-line
        globalMiddlewaresFirst.unshift([path.slice(0, -2), middleware]);
        return true;
      } if (filePath.lastIndexOf('/__.') === filePath.length - 6) {
        // Middleware for end
        const middleware = require(filePath); // eslint-disable-line
        globalMiddlewaresEnd.unshift([path.slice(0, -3), middleware]);
        return true;
      } if (filePath.lastIndexOf('/.pre.') === filePath.length - 8) {
        // Controller for begin
        const middleware = require(filePath); // eslint-disable-line
        globalControllerFirst.unshift([path.slice(0, -5), middleware]);
        return true;
      } if (filePath.lastIndexOf('/.post.') === filePath.length - 9) {
        // Controller for end
        const middleware = require(filePath); // eslint-disable-line
        globalControllerEnd.unshift([path.slice(0, -6), middleware]);
        return true;
      } if (filePath.lastIndexOf('/.err.') === filePath.length - 8) {
        // Controller for end
        const middleware = require(filePath); // eslint-disable-line
        globalErrorHandler.unshift([path.slice(0, -5), middleware]);
        return true;
      }

      const routes = require(filePath); // eslint-disable-line
      let middlewareForGlobal = findMiddleware(path, true);
      let middlewareForGlobalEnd = findMiddleware(path, false);
      const controllerForGlobal = findController(path, true);
      const controllerForGlobalEnd = findController(path, false);
      const errorHandlerGlobal = findErrorHandler(path);
      const methods = ['get', 'post', 'delete', 'put'];

      methods.forEach((method) => {
        if (typeof routes[method] === 'function') {
          let replaceAll = routes.path || routes._;
          let replaceMethod = routes[`${method}Path`]
                              || routes[`_${method}`]; // getPath, _get
          const suffix = routes[`${method}Suffix`]
                       || routes[`${method}_`]; // getSuffix, get_
          let middlewaresForAll = routes.middlewares
                                  || routes.middleware
                                  || routes.__; // eslint-disable-line no-underscore-dangle
          let middlewares = routes[`${method}Middlewares`]
                            || routes[`${method}Middleware`]
                            || routes[`_${method}_`]; // getMiddlewares, getMiddleware, _get_

          const controllerPrefix = controllerForGlobal
            ? (controllerForGlobal[method] || controllerForGlobal.all)
            : null;
          const controllerSuffix = controllerForGlobalEnd
            ? (controllerForGlobalEnd[method] || controllerForGlobalEnd.all)
            : null;

          if (middlewareForGlobal && typeof (middlewareForGlobal) === 'function') {
            middlewareForGlobal = [middlewareForGlobal];
          }

          if (middlewareForGlobalEnd && typeof (middlewareForGlobalEnd) === 'function') {
            middlewareForGlobalEnd = [middlewareForGlobalEnd];
          }

          if (middlewaresForAll && typeof (middlewaresForAll) === 'function') {
            middlewaresForAll = [middlewaresForAll];
          }

          if (middlewares && typeof (middlewares) === 'function') {
            middlewares = [middlewares];
          }

          // replace url by .dp config
          if (configParam && configParam.path && configParam.path.prefix) {
            if (replaceAll) {
              replaceAll = (replaceAll.slice(0, 1) === '/' ? configParam.path.prefix.slice(0, -1) : configParam.path.prefix) + replaceAll;
            } else if (replaceMethod) {
              replaceMethod = (replaceMethod.slice(0, 1) === '/' ? configParam.path.prefix.slice(0, -1) : configParam.path.prefix) + replaceMethod;
            }
          }

          const middleware = middlewares || middlewaresForAll || middlewareForGlobal;
          let routePath = replaceAll || replaceMethod || path;

          routePath += (suffix || '');

          trees.push([
            method,
            routePath,
            routes[method],
            middleware,
            middlewareForGlobalEnd,
            controllerPrefix,
            controllerSuffix,
            errorHandlerGlobal,
          ]);
        }
      });

      return true;
    };

    const traverse = (path, dirPath) => {
      try {
        if (!fs.statSync(dirPath).isDirectory()) {
          return;
        }
      } catch (_) {
        // eslint-disable-next-line no-console
        console.error(`Controller path load error, ${dirPath}`);
        return;
      }

      const files = fs.readdirSync(dirPath);

      files.sort((a, b) => { // eslint-disable-line no-unused-vars
        if (a.indexOf('_.') === 0 || a.indexOf('__.') === 0 || a.indexOf('.') === 0) return -1;
        return 1;
      });

      files.forEach((name) => {
        const fullPath = `${dirPath}/${name}`;

        if (name.startsWith('.')
            && name !== '.dp'
            && name !== '.pre.js'
            && name !== '.post.js'
            && name !== '.err.js') {
          return;
        }

        if (name === '.dp') {
          // Configs
          const dpIni = ini.parse(fs.readFileSync(fullPath, 'utf-8'));
          dpIni._ = path;

          if (dpIni && dpIni.path && dpIni.path.prefix) {
            // eslint-disable-next-line operator-assignment
            dpIni.path.prefix = dpIni.path.prefix + (dpIni.path.prefix.slice(-1) === '/' ? '' : '/');
          }

          configs.unshift([dirPath, dpIni]);
          return;
        }

        if (fs.statSync(fullPath).isDirectory()) {
          traverse(`${path}/${name}`, fullPath);
        } else if (name.toLowerCase().endsWith('.js')) {
          const foundCfg = findConfig(dirPath);
          let subPath = name !== 'index.js' ? `${path}/${name.substr(0, name.lastIndexOf('.'))}` : path;

          if (foundCfg && foundCfg.path && foundCfg.path.prefix) {
            const a = `${subPath.slice(0, foundCfg._.length)}/`;
            const b = subPath.slice(foundCfg._.length + 1);
            const x = `---___---${Date.now()}---___---`;
            subPath = url.resolve(a, foundCfg.path.prefix.split('\\').join(x));
            subPath = url.resolve(subPath, b);
            subPath = subPath.slice(-1) === '/' ? subPath.slice(0, -1) : subPath;
            subPath = subPath.split(x).join('\\');
          }

          includePreapre(subPath, fullPath, foundCfg);
        }
      });
    };

    const includes = () => {
      const pp = []; // Only paths
      const ps = []; // Parameter paths

      // More specific paths are first.
      // /foo/bar is high priority than /foo
      // /foo/bar is high priority than /foo/:type

      trees.forEach((e, k) => {
        if (e[1].indexOf(':') === -1) pp.push(k);
        else ps.push(k);
      });

      pp.sort((a, b) => {
        const a1 = trees[a][1].split('/');
        const b1 = trees[b][1].split('/');

        if (a1.length > b1.length) return -1;
        if (a1.length < b1.length) return 1;

        if (trees[a][1] === trees[b][1]) return 0;
        if (trees[a][1] > trees[b][1]) return -1;
        return 1;
      });

      ps.sort((a, b) => {
        const a1 = trees[a][1].split('/');
        const b1 = trees[b][1].split('/');

        if (a1.length > b1.length) return -1;
        if (a1.length < b1.length) return 1;

        if (trees[a][1] === trees[b][1]) return 0;
        if (trees[a][1] > trees[b][1]) return -1;
        return 1;
      });

      pp.concat(ps).forEach((e) => {
        delegates.route.apply(this, trees[e]);
      });
    };

    traverse('', config.cfg.controller);
    includes();

    config.app.use(async (req, res, next) => { // eslint-disable-line no-unused-vars
      const ctrl = controller.delegate(config, req, res, session, cookie);

      try {
        const errorHandlerGlobal = findErrorHandler(req.url);

        if (typeof errorHandlerGlobal === 'function') {
          const httpError = new createHttpError.NotFound();
          httpError.code = 404;

          const resp = await errorHandlerGlobal(ctrl, httpError);

          if (!res.buffer) {
            res.buffer = {
              code: 404,
              body: resp || '404 Page Notfound',
            };
          }

          finalizeMiddleware(req, res);
          return;
        }
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
      }

      controller.handler.serverError(ctrl, req, res, config, new dpError('404 Page Notfound', req), 404) // eslint-disable-line
    });
  }

  return delegates;
};
