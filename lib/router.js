'use strict';

const createHttpError = require('http-errors');
const bodyParser = require('body-parser');
const ini = require('ini');
const fs = require('fs');
const dpError = require('./misc/dp_error');
const controller = require('./controller');
const sessionLib = require('./controller/library/session');
const cookieLib = require('./controller/library/cookie');
const functions = require('./functions');

const HTTP_METHODS = [
  'checkout', 'copy', 'delete', 'get', 'head', 'lock', 'merge', 'mkactivity',
  'mkcol', 'move', 'm-search', 'notify', 'options', 'patch', 'post', 'purge',
  'put', 'report', 'search', 'subscribe', 'trace', 'unlock', 'unsubscribe',
];
const hasOwn = Object.prototype.hasOwnProperty;
const isObject = x => (x && typeof x === 'object');
const fn2Sngltn = a => (typeof a === 'function' ? [a] : a);
const propGetAlts = (o, ...keys) => {
  if (typeof o === 'object' || typeof o === 'function') {
    for (let i = 0; i !== keys.length; i += 1) {
      const v = o[keys[i]];
      if (typeof v !== 'undefined') return v;
    }
  }
  return undefined;
};
const {
  getRequireExt, applyPath, joinPathNaive, countSlashes,
} = functions;
const isArrowFunction = ((m, f) => (x) => {
  let v = m.get(x);
  if (v == null) m.set(x, v = f(x));
  return v;
})(new WeakMap(), functions.isArrowFunction);

const autoRegisterMiddlewares = (delegates, config) => {
  const trees = [];
  const configs = [];
  const globalMiddlewaresFirst = [];
  const globalMiddlewaresEnd = [];
  const globalControllerFirst = [];
  const globalControllerEnd = [];
  const globalErrorHandler = [];

  const symBubbled = Symbol('dp-node.bubbled');
  const findConfig = (path) => {
    const stack = [];
    let last;
    for (let i = 0; i < configs.length; i += 1) {
      const [p, v] = configs[i];
      if (path.startsWith(p)) {
        if (v && v.path && v.path.bubbling && !v.path[symBubbled]) {
          stack.push(v);
        } else {
          last = v;
          break;
        }
      }
    }
    while (stack.length) {
      const item = stack.pop();
      if (last && last.path && last.path.prefix) {
        item.path.prefix = joinPathNaive(last.path.prefix, item.path.prefix);
        item.path[symBubbled] = true;
      }
      last = item;
    }
    return last;
  };

  const findMiddleware = (middlewares, path) => {
    const item = middlewares.find(([p]) => (path.startsWith(p) && (
      path.length === p.length || path.charAt(p.length) === '/')));
    return item ? item[1] : undefined;
  };

  const specialMiddlewareFileNames = {
    _: globalMiddlewaresFirst,
    __: globalMiddlewaresEnd,
    '.pre': globalControllerFirst,
    '.post': globalControllerEnd,
    '.err': globalErrorHandler,
  };

  const prepareInclude = (path, filePath, configParam, extension) => {
    if (!fs.statSync(filePath).isFile()) return undefined;

    const basename = filePath.substring(filePath.lastIndexOf('/') + 1);
    const name = basename.substring(0, basename.length - extension.length);
    if (hasOwn.call(specialMiddlewareFileNames, name)) {
      const registry = specialMiddlewareFileNames[name];
      let middleware = require(filePath);
      if (name === '_' || name === '__') middleware = fn2Sngltn(middleware);
      return registry.unshift([path.slice(0, -(name.length + 1)), middleware]); // tail call
    }

    const routes = require(filePath);
    const middlewareForGlobal = findMiddleware(globalMiddlewaresFirst, path);
    const middlewareForGlobalEnd = findMiddleware(globalMiddlewaresEnd, path);
    const controllerForGlobal = findMiddleware(globalControllerFirst, path);
    const controllerForGlobalEnd = findMiddleware(globalControllerEnd, path);
    const errorHandlerGlobal = findMiddleware(globalErrorHandler, path);

    const replaceForAll = propGetAlts(routes, 'path', '_');
    const middlewaresForAll = fn2Sngltn(propGetAlts(routes, 'middlewares', 'middleware', '__')) || middlewareForGlobal;
    const controllerPrefixAll = controllerForGlobal && controllerForGlobal.all;
    const controllerSuffixAll = controllerForGlobalEnd && controllerForGlobalEnd.all;

    // tail call
    return HTTP_METHODS.forEach((method) => {
      if (typeof routes[method] !== 'function') return;

      const suffix = propGetAlts(routes, `${method}Suffix`, `${method}_`); // getSuffix, get_
      const middlewares = fn2Sngltn(propGetAlts(routes, `${method}Middlewares`, `${method}Middleware`, `_${method}_`)); // getMiddlewares, getMiddleware, _get_

      const controllerPrefix = controllerForGlobal && (
        controllerForGlobal[method] || controllerPrefixAll);
      const controllerSuffix = controllerForGlobalEnd && (
        controllerForGlobalEnd[method] || controllerSuffixAll);

      let routePath = replaceForAll || propGetAlts(routes, `${method}Path`, `_${method}`); // getPath, _get
      if (!routePath) {
        routePath = path;
      } else if (configParam && configParam.path) {
        // replace path as specified in the effective .dp config
        const { prefix } = configParam.path;
        if (prefix) routePath = joinPathNaive(prefix, routePath);
      }
      if (suffix) routePath += suffix;

      const middleware = middlewares || middlewaresForAll;

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
    });
  };

  const symConfigOriginPath = Symbol('dp-node.configOriginPath');

  const traverse = (path, dirPath) => {
    try {
      if (!fs.statSync(dirPath).isDirectory()) return undefined;
    } catch (e) {
      return console.error('Controller path load error, %s: %O', dirPath, e); // tail call
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
        Object.defineProperty(dpIni, symConfigOriginPath, {
          configurable: true, enumerable: false, writable: false, value: path,
        });

        return configs.unshift([dirPath, dpIni]); // tail call
      }

      if (fs.statSync(fullPath).isDirectory()) {
        return traverse(`${path}/${name}`, fullPath); // tail call
      }

      const ext = getRequireExt(name);
      if (ext == null) return undefined;

      const foundCfg = findConfig(dirPath);
      const extlessName = name.substring(0, name.length - ext.length);
      let subPath = path;
      if (extlessName && extlessName !== 'index') subPath += `/${extlessName}`;

      if (foundCfg && foundCfg.path) {
        const { prefix } = foundCfg.path;
        if (prefix) {
          const spl = foundCfg[symConfigOriginPath].length;
          const parts = subPath.substring(0, spl).split('/');
          applyPath(parts, prefix.split('/'));
          applyPath(parts, subPath.substring(spl + 1).split('/'));
          if (parts[parts.length - 1] === '') parts.pop();
          subPath = parts.join('/');
        }
      }

      return prepareInclude(subPath, fullPath, foundCfg, ext); // tail call
    });
  };

  traverse('', config.cfg.controller);

  // More specific paths are first.
  // /foo/bar is high priority than /foo
  // /foo/bar is high priority than /foo/:type

  const {
    session, cookie, middlewarePostproc, route,
  } = delegates;
  trees.reduce(
    (pps, e) => ((pps[+(e[1].indexOf(':') !== -1)].push(e), pps)),
    [[], []] /* [ Only paths, Parameter paths ] */
  ).forEach(paths => (
    paths.sort(([a], [b]) => countSlashes(b) - countSlashes(a) || (b > a) - (b < a))
      .forEach(e => route(...e))));

  config.app.use((req, res, _next) => {
    const ctrl = controller.delegate(config, req, res, session, cookie);
    const errorHandlerGlobal = findMiddleware(globalErrorHandler, req.url);

    if (typeof errorHandlerGlobal !== 'function') {
      controller.handler.serverError(ctrl, req, res, config, new dpError('404 Not Found', req), 404);
      return;
    }

    new Promise((resolve) => {
      const httpError = new createHttpError.NotFound();
      httpError.code = 404;

      resolve(errorHandlerGlobal(ctrl, httpError));
    }).then((resp) => {
      if (!res.buffer) res.buffer = { code: 404, body: resp || '404 Not Found' };

      middlewarePostproc(req, res);
    }, (e) => {
      console.error(e);

      const err = new dpError(e, req);
      err.message = '404 Not Found';
      controller.handler.serverError(ctrl, req, res, config, err, 404);
    }).catch(e => console.error(e));
  });
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
    global.__dpSessionEngine__ = session;
  }

  const bodyParseRequiredMethods = { post: true, put: true, delete: true };
  const bodyParserUrlEncoded = bodyParser.urlencoded(bodyParserUrlEncodedOpts);

  const handler = (delegate, req, res, data) => {
    const ctrl = controller.delegate(config, req, res, session, cookie);
    const args = isArrowFunction(delegate) ? [ctrl, data] : [data];
    return Promise.resolve(delegate.apply(ctrl, args));
  };

  const middlewarePostproc = (req, res, _next) => {
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
    session,
    cookie,
    middlewarePostproc,
    route(
      method,
      path,
      delegate,
      middlewares,
      middlewaresEnd,
      controllerPrefix,
      controllerSuffix,
      controllerErrorHandler
    ) {
      const params = [path];

      if (hasOwn.call(bodyParseRequiredMethods, method)) params.push(bodyParserUrlEncoded);

      // Add middlewares
      if (isObject(middlewares) || isObject(middlewaresEnd)) {
        params.push((req, res, next) => {
          const dp = (callback) => {
            const ctrl = controller.delegate(config, req, res, session, cookie);
            const handlerObj = {
              controller: ctrl,
              helper: config.helper,
              model: config.model,
            };

            return new Promise(resolve => resolve(callback(handlerObj)))
              .catch((err) => {
                const errObj = new dpError(err, req);
                return controller.handler.serverError(ctrl, req, res, config, errObj, 500);
              });
          };

          req.async = dp;
          res.async = dp;

          next();
        });
      }

      // Add middlewares
      if (isObject(middlewares)) params.push(middlewares);

      const hasMiddlewaresEnd = isObject(middlewaresEnd);

      const symPrefix = Symbol('dp-node.prefix');
      const symBody = Symbol('dp-node.body');

      const controllerPostproc = (req, res, next, done, resKey, isHandlingError) => (
        done.then((resp) => {
          if (typeof res.buffer === 'undefined' && resp) {
            if (resKey) {
              res[resKey] = resp;
            } else {
              res.buffer = {
                code: isHandlingError ? 500 : 200,
                body: resp,
              };
            }
          } else if (resp === true && hasMiddlewaresEnd) {
            middlewarePostproc(req, res);
            return;
          }

          next();
        }).catch((err) => {
          if (controllerErrorHandler && !isHandlingError) {
            next(err);
            return;
          }

          const ctrl = controller.delegate(config, req, res, session, cookie);
          const error = new dpError(err, req);
          controller.handler.serverError(ctrl, req, res, config, error, 500);
        }));

      if (controllerPrefix) {
        params.push((req, res, next) => {
          const done = handler(controllerPrefix, req, res);
          controllerPostproc(req, res, next, done, symPrefix);
        });
      }

      // Add action
      params.push((req, res, next) => {
        const done = handler(delegate, req, res, res[symPrefix]);
        controllerPostproc(req, res, next, done, controllerSuffix ? symBody : null);
      });

      if (controllerSuffix) {
        params.push((req, res, next) => {
          const done = handler(controllerSuffix, req, res, res[symBody]);
          controllerPostproc(req, res, next, done);
        });
      }

      // Add middlewares for end
      if (hasMiddlewaresEnd) params.push(middlewaresEnd);

      // Error handling on controller
      if (controllerErrorHandler) {
        params.push((err, req, res, next) => {
          const done = handler(controllerErrorHandler, req, res, err);
          controllerPostproc(req, res, next, done, null, true);
        });
      }

      // Postprocess and global error handling
      params.push(middlewarePostproc, (err, req, res, _next) => {
        const ctrl = controller.delegate(config, req, res, session, cookie);
        const error = new dpError(err, req);
        controller.handler.serverError(ctrl, req, res, config, error, 500);
      });

      config.app[method](...params);
    },
  };

  if (config.cfg.controller) autoRegisterMiddlewares(delegates, config);

  return delegates;
};
