const createHttpError = require('http-errors');
const bodyParser = require('body-parser');
const ini = require('ini');
const fs = require('fs');
const dpError = require('./misc/dp_error');
const controller = require('./controller');
const sessionLib = require('./controller/library/session');
const cookieLib = require('./controller/library/cookie');
const functions = require('./functions');

const hasOwn = Object.prototype.hasOwnProperty;
const isObject = x => (x && typeof x === 'object');
const fn2Sngltn = a => (typeof a === 'function' ? [a] : a);
const { getRequireExt } = functions;
const isArrowFunction = ((m, f) => (x) => {
  let v = m.get(x);
  if (v == null) {
    v = f(x);
    m.set(x, v);
  }
  return v;
})(new WeakMap(), functions.isArrowFunction);
const applyPath = (baseParts, relParts) => {
  const bp = baseParts;
  if (relParts.length > 1 && relParts[0] === '') {
    bp.length = 2;
    bp[0] = '';
    bp[1] = '';
  }
  for (let i = 0; i !== relParts.length; i += 1) {
    const part = relParts[i];
    const len = bp.length;
    switch (part) {
      case '': case '.':
        break;
      case '..':
        switch (len) {
          case 0:
            break;
          case 1:
            if (bp[0] !== '' && bp[0] !== '..') {
              bp[0] = '';
              continue; // eslint-disable-line no-continue
            }
            break;
          case 2:
            if (bp[0] === '') {
              bp[1] = '';
              continue; // eslint-disable-line no-continue
            }
          /* fallthrough */
          default:
            if (bp[len - 1] !== '..') {
              if (len === 1) bp[0] = '';
              else bp.length = len - 1;
              continue; // eslint-disable-line no-continue
            }
            break;
        }
      /* fallthrough */
      default:
        bp[bp[len - 1] !== '' ? len : len - 1] = part;
        break;
    }
  }
  if (relParts.length > 0 && relParts[relParts.length - 1] === '') {
    const len = bp.length;
    if (len === 0 || (len === 1 && bp[0] === '')) {
      bp.length = 2;
      bp[0] = '.';
      bp[1] = '';
    } else {
      bp[bp[len - 1] !== '' ? len : len - 1] = '';
    }
  }
  return bp;
};

module.exports = (config) => {
  const session = sessionLib(config);
  const cookie = cookieLib(config);

  const bodyParserUrlEncodedOpts = { extended: true };

  const { requestSizeLimit } = config.cfg;
  if (typeof requestSizeLimit !== 'undefined') {
    bodyParserUrlEncodedOpts.limit = requestSizeLimit;
  }

  // Assign engine when test mode enabled.
  if (global.isTest) {
    global.__dpSessionEngine__ = session; // eslint-disable-line no-underscore-dangle
  }

  const bodyParseRequired = { post: true, put: true, delete: true };
  const bodyParserUrlEncoded = bodyParser.urlencoded(bodyParserUrlEncodedOpts);

  const handler = (delegate, req, res, data) => {
    const ctrl = controller.delegate(config, req, res, session, cookie);
    const args = isArrowFunction(delegate) ? [ctrl, data] : [data];
    return Promise.resolve(delegate.apply(ctrl, args));
  };

  const finalizeMiddleware = (req, res, next) => { // eslint-disable-line no-unused-vars
    if (res.bufferRedirect) {
      if (res.bufferRedirect.code) {
        res.redirect(res.bufferRedirect.url, res.bufferRedirect.code);
      } else {
        res.redirect(res.bufferRedirect.url);
      }
    } else if (res.buffer && typeof res.buffer.body !== 'undefined') {
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
      let params = [path];

      if (hasOwn.call(bodyParseRequired, method)) {
        params.push(bodyParserUrlEncoded);
      }

      // Add middlewares
      if (isObject(middlewares) || isObject(middlewaresEnd)) {
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
      if (isObject(middlewares)) {
        params = params.concat(middlewares);
      }

      const isAvailableMiddlewaresForEnd = isObject(middlewaresEnd);

      const symPrefix = Symbol('dp-node.prefix');
      const symBody = Symbol('dp-node.body');

      const finalizeController = (req, res, next, done, resKey, error) => {
        done.then((resp) => {
          if (typeof (res.buffer) === 'undefined' && resp) {
            if (resKey) {
              res[resKey] = resp;
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
          finalizeController(req, res, next, done, symPrefix);
        });
      }

      // Add action
      params.push((req, res, next) => {
        const done = handler(delegate, req, res, res[symPrefix]);
        finalizeController(req, res, next, done, controllerSuffix ? symBody : null);
      });

      if (controllerSuffix) {
        params.push((req, res, next) => {
          const done = handler(controllerSuffix, req, res, res[symBody]);
          finalizeController(req, res, next, done);
        });
      }

      // Add middlewares for end
      if (isAvailableMiddlewaresForEnd) {
        params = params.concat(middlewaresEnd);
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

      config.app[method](...params);
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
      const item = configs.find(([p]) => path.startsWith(p));
      return item ? item[1] : null;
    };

    const findMiddleware = (middlewares, path) => {
      const item = middlewares.find(([p]) => (
        path.startsWith(p) && (path.length === p.length || path.charAt(p.length) === '/')));
      return item ? item[1] : null;
    };

    const specialMiddlewareFileNames = {
      _: globalMiddlewaresFirst,
      __: globalMiddlewaresEnd,
      '.pre': globalControllerFirst,
      '.post': globalControllerEnd,
      '.err': globalErrorHandler,
    };

    const includePreapre = (path, filePath, configParam) => {
      if (!fs.statSync(filePath).isFile()) {
        return false;
      }

      const basename = filePath.substring(filePath.lastIndexOf('/') + 1);
      const dotIdx = basename.lastIndexOf('.');
      const name = dotIdx !== -1 ? basename.substring(0, dotIdx) : basename;
      if (hasOwn.call(specialMiddlewareFileNames, name)) {
        const registry = specialMiddlewareFileNames[name];
        const middleware = require(filePath); // eslint-disable-line
        registry.unshift([path.slice(0, -(name.length + 1)), middleware]);
        return true;
      }

      const routes = require(filePath); // eslint-disable-line
      const middlewareForGlobal = fn2Sngltn(findMiddleware(globalMiddlewaresFirst, path));
      const middlewareForGlobalEnd = fn2Sngltn(findMiddleware(globalMiddlewaresEnd, path));
      const controllerForGlobal = findMiddleware(globalControllerFirst, path);
      const controllerForGlobalEnd = findMiddleware(globalControllerEnd, path);
      const errorHandlerGlobal = findMiddleware(globalErrorHandler, path);
      const methods = [
        'checkout', 'copy', 'delete', 'get', 'head', 'lock', 'merge', 'mkactivity',
        'mkcol', 'move', 'm-search', 'notify', 'options', 'patch', 'post', 'purge',
        'put', 'report', 'search', 'subscribe', 'trace', 'unlock', 'unsubscribe',
      ];

      methods.forEach((method) => {
        if (typeof routes[method] === 'function') {
          const replaceAll = routes.path || routes._;
          const replaceMethod = routes[`${method}Path`]
                              || routes[`_${method}`]; // getPath, _get
          const suffix = routes[`${method}Suffix`]
                       || routes[`${method}_`]; // getSuffix, get_
          const middlewaresForAll = fn2Sngltn(routes.middlewares
                                  || routes.middleware
                                  || routes.__); // eslint-disable-line no-underscore-dangle
          const middlewares = fn2Sngltn(routes[`${method}Middlewares`]
                            || routes[`${method}Middleware`]
                            || routes[`_${method}_`]); // getMiddlewares, getMiddleware, _get_

          const controllerPrefix = controllerForGlobal
            ? (controllerForGlobal[method] || controllerForGlobal.all)
            : null;
          const controllerSuffix = controllerForGlobalEnd
            ? (controllerForGlobalEnd[method] || controllerForGlobalEnd.all)
            : null;

          // replace url by .dp config
          let routePath = replaceAll || replaceMethod;
          if (!routePath) {
            routePath = path;
          } else if (configParam && configParam.path) {
            const { prefix } = configParam.path;
            if (prefix) {
              routePath = (routePath.startsWith('/') ? prefix.slice(0, -1) : prefix) + routePath;
            }
          }
          if (suffix) routePath += suffix;

          const middleware = middlewares || middlewaresForAll || middlewareForGlobal;

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
          return undefined;
        }
      } catch (_) {
        // eslint-disable-next-line no-console
        return console.error(`Controller path load error, ${dirPath}`); // tail call
      }

      const fre = /^(?:[^.]|\.(?:dp|(?:pre|post|err)\.[^.]+)$)/;
      const files = fs.readdirSync(dirPath).filter(RegExp.prototype.test.bind(fre));

      const srf = RegExp.prototype.test.bind(/^_{0,2}\./);
      files.sort((a, b) => !srf(a) - !srf(b) || (a > b) - (a < b));

      // tail call
      return files.forEach((name) => {
        const fullPath = `${dirPath}/${name}`;

        if (name === '.dp') {
          // Configs
          const dpIni = ini.parse(fs.readFileSync(fullPath, 'utf-8'));
          dpIni._ = path;

          const pathSec = dpIni.path;
          if (pathSec) {
            const pfx = pathSec.prefix;
            if (pfx && !pfx.endsWith('/')) pathSec.prefix = `${pfx}/`;
          }

          return configs.unshift([dirPath, dpIni]); // tail call
        }

        if (fs.statSync(fullPath).isDirectory()) {
          return traverse(`${path}/${name}`, fullPath); // tail call
        }
        const ext = getRequireExt(name);
        if (ext != null) {
          const foundCfg = findConfig(dirPath);
          let subPath = name !== `index${ext}` ? `${path}/${name.substr(0, name.lastIndexOf('.'))}` : path;

          if (foundCfg && foundCfg.path) {
            const { prefix } = foundCfg.path;
            if (prefix) {
              const spl = foundCfg._.length;
              const parts = subPath.substring(0, spl).split('/');
              applyPath(parts, prefix.split('/'));
              parts.pop();
              applyPath(parts, subPath.substring(spl + 1).split('/'));
              if (parts[parts.length - 1] === '') parts.length -= 1;
              subPath = parts.join('/');
            }
          }

          return includePreapre(subPath, fullPath, foundCfg); // tail call
        }
        return undefined;
      });
    };

    const includes = () => {
      const pps = [[], []]; // [ Only paths, Parameter paths ]

      // More specific paths are first.
      // /foo/bar is high priority than /foo
      // /foo/bar is high priority than /foo/:type

      trees.forEach(e => pps[+(e[1].indexOf(':') !== -1)].push(e));
      pps.forEach(paths => (
        paths.sort(([a], [b]) => (b.split('/').length - a.split('/').length || (b > a) - (b < a)))
          .forEach(e => delegates.route(...e))));
    };

    traverse('', config.cfg.controller);
    includes();

    config.app.use(async (req, res, next) => { // eslint-disable-line no-unused-vars
      const ctrl = controller.delegate(config, req, res, session, cookie);

      try {
        const errorHandlerGlobal = findMiddleware(globalErrorHandler, req.url);

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
