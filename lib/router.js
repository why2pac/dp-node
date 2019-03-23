'use strict';

const bodyParser = require('body-parser');
const ini = require('ini');
const fs = require('fs');
const dpError = require('./misc/dp_error');
const controller = require('./controller');
const sessionLib = require('./controller/library/session');
const cookieLib = require('./controller/library/cookie');
const {
  applyPath, joinPathNaive, countSlashes, isArrowFunction,
} = require('./functions');

const HTTP_METHODS = [
  'checkout', 'copy', 'delete', 'get', 'head', 'lock', 'merge', 'mkactivity',
  'mkcol', 'move', 'm-search', 'notify', 'options', 'patch', 'post', 'purge',
  'put', 'report', 'search', 'subscribe', 'trace', 'unlock', 'unsubscribe',
];
const hasOwn = Object.prototype.hasOwnProperty;
const isObject = x => (typeof x === 'object' && x !== null);
const fn2Sngltn = a => (typeof a === 'function' ? [a] : a);
const propGetAlts = (o, ...keys) => {
  if (o !== null && (typeof o === 'object' || typeof o === 'function')) {
    for (let i = 0; i !== keys.length; i += 1) {
      const v = o[keys[i]];
      if (typeof v !== 'undefined') return v;
    }
  }
  return undefined;
};
const NOT_FOUND = Object.preventExtensions(Object.create(Error.prototype, {
  name: {
    value: 'NotFound', writable: false, enumerable: false, configurable: false,
  },
  message: {
    value: 'Not Found', writable: false, enumerable: false, configurable: false,
  },
  code: {
    value: 404, writable: false, enumerable: false, configurable: false,
  },
}));
const configFname = '.dp';
const isValidDpFname = RegExp.prototype.test.bind(/^(?:[^.]|\.(?:dp|(?:pre|post|err)\.[^.]+)$)/);
const isUscoreFname = RegExp.prototype.test.bind(/^_{0,2}\./);

class Registry {
  constructor() {
    this.items = [];
  }

  add(...args) {
    this.items.push(args);
  }
}

const symBubbled = Symbol('dp-node.bubbled');
const symPrefixLength = Symbol('dp-node.prefixLength');
class ConfigRegistry extends Registry {
  find(path) {
    const configs = this.items;
    const stack = [];
    let last;
    for (let i = configs.length; i > 0;) {
      const [p, v] = configs[i -= 1];
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
  }

  addConfigFile(targetPath, targetDir, fullPath) {
    const dpIni = ini.parse(fs.readFileSync(fullPath, 'utf-8'));
    Object.defineProperty(dpIni, symPrefixLength, {
      value: targetPath.length, writable: false, enumerable: false, configurable: true,
    });

    return this.add(targetDir, dpIni); // tail call
  }

  static resolvePrefix(config, path) {
    const pathObj = config && config.path;
    const prefix = pathObj && pathObj.prefix;
    if (!prefix) return path;

    const spl = config[symPrefixLength];
    const parts = path.substring(0, spl).split('/');
    applyPath(parts, prefix.split('/'));
    applyPath(parts, path.substring(spl + 1).split('/'));
    if (parts[parts.length - 1] === '') parts.pop();
    return parts.join('/');
  }
}

class MiddlewareRegistry extends Registry {
  find(path) {
    const middlewares = this.items;
    let last;
    for (let i = middlewares.length; i > 0;) {
      const [p, v] = middlewares[i -= 1];
      if (path.startsWith(p) && (path.length === p.length || path.charAt(p.length) === '/')) {
        last = v;
        break;
      }
    }
    return last;
  }
}

const autoRegisterMiddlewares = (delegates, config) => {
  const configs = new ConfigRegistry();
  const globalMiddlewaresFirst = new MiddlewareRegistry();
  const globalMiddlewaresEnd = new MiddlewareRegistry();
  const globalControllerFirst = new MiddlewareRegistry();
  const globalControllerEnd = new MiddlewareRegistry();
  const globalErrorHandler = new MiddlewareRegistry();

  const specialMiddlewareFileNames = {
    _: globalMiddlewaresFirst,
    __: globalMiddlewaresEnd,
    '.pre': globalControllerFirst,
    '.post': globalControllerEnd,
    '.err': globalErrorHandler,
  };

  const prepareInclude = (visitor, docPath, filePath, configParam, extension) => {
    if (!fs.statSync(filePath).isFile()) return undefined;

    const basename = filePath.substring(filePath.lastIndexOf('/') + 1);
    const name = basename.substring(0, basename.length - extension.length);
    if (hasOwn.call(specialMiddlewareFileNames, name)) {
      const registry = specialMiddlewareFileNames[name];
      let middleware = require(filePath);
      if (name === '_' || name === '__') middleware = fn2Sngltn(middleware);
      return registry.add(docPath.slice(0, -(name.length + 1)), middleware); // tail call
    }

    const routes = require(filePath);
    const middlewareForGlobal = globalMiddlewaresFirst.find(docPath);
    const middlewareForGlobalEnd = globalMiddlewaresEnd.find(docPath);
    const controllerForGlobal = globalControllerFirst.find(docPath);
    const controllerForGlobalEnd = globalControllerEnd.find(docPath);
    const errorHandlerGlobal = globalErrorHandler.find(docPath);

    const replaceForAll = propGetAlts(routes, 'path', '_');
    const middlewaresForAll = fn2Sngltn(propGetAlts(routes, 'middlewares', 'middleware', '__')) || middlewareForGlobal;
    const controllerPrefixAll = controllerForGlobal && controllerForGlobal.all;
    const controllerSuffixAll = controllerForGlobalEnd && controllerForGlobalEnd.all;

    // tail call
    return HTTP_METHODS.forEach((method) => {
      const delegate = routes[method];
      if (typeof delegate !== 'function') return;

      const suffix = propGetAlts(routes, `${method}Suffix`, `${method}_`); // getSuffix, get_
      const middlewares = fn2Sngltn(propGetAlts(routes, `${method}Middlewares`, `${method}Middleware`, `_${method}_`)); // getMiddlewares, getMiddleware, _get_

      const controllerPrefix = controllerForGlobal && (
        controllerForGlobal[method] || controllerPrefixAll);
      const controllerSuffix = controllerForGlobalEnd && (
        controllerForGlobalEnd[method] || controllerSuffixAll);

      let path = replaceForAll || propGetAlts(routes, `${method}Path`, `_${method}`); // getPath, _get
      if (!path) {
        path = docPath;
      } else if (configParam && configParam.path) {
        // replace path as specified in the effective .dp config
        const { prefix } = configParam.path;
        if (prefix) path = joinPathNaive(prefix, path);
      }
      if (suffix) path += suffix;

      const middleware = middlewares || middlewaresForAll;

      visitor(
        method,
        path,
        delegate,
        middleware,
        middlewareForGlobalEnd,
        controllerPrefix,
        controllerSuffix,
        errorHandlerGlobal
      );
    });
  };

  const exts = require.extensions || { '.js': null };
  const traverse = (path, dirPath, visitor) => {
    try {
      if (!fs.statSync(dirPath).isDirectory()) return undefined;
    } catch (e) {
      return console.error('Controller path load error, %s: %O', dirPath, e); // tail call
    }

    // tail call
    return fs.readdirSync(dirPath).filter(isValidDpFname)
      .sort((a, b) => !isUscoreFname(a) - !isUscoreFname(b) || (a > b) - (a < b))
      .forEach((name) => {
        const fullPath = `${dirPath}/${name}`;

        if (fs.statSync(fullPath).isDirectory()) {
          return traverse(`${path}/${name}`, fullPath, visitor); // tail call
        }

        if (name === configFname) {
          return configs.addConfigFile(path, dirPath, fullPath); // tail call
        }

        const ext = Object.keys(exts).find(x => name.endsWith(x));
        if (ext == null) return undefined;

        const foundCfg = configs.find(dirPath);
        const extlessName = name.substring(0, name.length - ext.length);
        const subPath = ConfigRegistry.resolvePrefix(
          foundCfg,
          extlessName && extlessName !== 'index' ? `${path}/${extlessName}` : path
        );

        return prepareInclude(visitor, subPath, fullPath, foundCfg, ext); // tail call
      });
  };

  // More specific paths are first.
  // /foo/bar is high priority than /foo
  // /foo/bar is high priority than /foo/:type

  const pps = [[], []]; // [ Nullary paths, Parameterized paths ]
  traverse('', config.cfg.controller, (...args) => pps[+args[1].includes(':')].push(args));

  pps.forEach(paths => (
    paths.sort(([a], [b]) => countSlashes(b) - countSlashes(a) || (b > a) - (b < a))
      .forEach(e => delegates.route(...e))));

  delegates.routeDefault(req => globalErrorHandler.find(req.url));
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

  const middlewarePostproc = (req, res, _next) => {
    if (res.bufferRedirect) {
      res.redirect(res.bufferRedirect.code || 302, res.bufferRedirect.url);
    } else if (res.buffer && typeof res.buffer.body !== 'undefined') {
      res.status(res.buffer.code).send(res.buffer.body);
    } else {
      res.status(204).send();
    }
  };

  const delegates = {
    routeDefault(delegateFor) {
      config.app.use((req, res, _next) => {
        const ctrl = controller.delegate(config, req, res, session, cookie);
        const errorHandlerGlobal = delegateFor(req);

        if (typeof errorHandlerGlobal !== 'function') {
          controller.handler.serverError(ctrl, req, res, config, new dpError('404 Not Found', req), 404);
          return;
        }

        new Promise(resolve => resolve(errorHandlerGlobal(ctrl, NOT_FOUND))).then((resp) => {
          if (!res.buffer) res.buffer = { code: 404, body: resp || '404 Not Found' };

          middlewarePostproc(req, res);
        }, (e) => {
          console.error(e);

          const err = new dpError(e, req);
          err.message = '404 Not Found';
          controller.handler.serverError(ctrl, req, res, config, err, 404);
        }).catch(e => console.error(e));
      });
    },
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

      function addCallback(dcbf, resKey, dataKey) {
        if (dcbf == null) return;
        const dfn = isArrowFunction(dcbf) ? dcbf : Function.prototype.call.bind(dcbf);
        const handlingError = arguments.length === 1;
        const fn = (dataOrError, req, res, next) => {
          const ctrl = controller.delegate(config, req, res, session, cookie);
          return Promise.resolve(dfn(ctrl, dataOrError)).then((resp) => {
            if (typeof res.buffer === 'undefined' && resp) {
              if (resKey != null) {
                res[resKey] = resp;
              } else {
                res.buffer = { code: handlingError ? 500 : 200, body: resp };
              }
            } else if (resp === true && hasMiddlewaresEnd) {
              middlewarePostproc(req, res);
              return;
            }

            next();
          }).catch((err) => {
            if (controllerErrorHandler && !handlingError) {
              next(err);
              return;
            }

            const ctrlObj = controller.delegate(config, req, res, session, cookie);
            const error = new dpError(err, req);
            controller.handler.serverError(ctrlObj, req, res, config, error, 500);
          });
        };
        params.push(handlingError ? fn : (req, res, next) => {
          let data;
          if (dataKey != null) {
            data = res[dataKey];
            delete res[dataKey];
          }
          return fn(data, req, res, next);
        });
      }

      addCallback(controllerPrefix, symPrefix);

      // Add action
      addCallback(delegate, controllerSuffix ? symBody : null, symPrefix);

      addCallback(controllerSuffix, null, symBody);

      if (hasMiddlewaresEnd) params.push(middlewaresEnd);

      // Error handling on controller
      addCallback(controllerErrorHandler);

      // Postprocess and global error handling
      params.push(middlewarePostproc, (err, req, res, _next) => (
        controller.handler.serverError(
          controller.delegate(config, req, res, session, cookie),
          req, res, config, new dpError(err, req), 500
        )));

      config.app[method](...params);
    },
  };

  if (config.cfg.controller) autoRegisterMiddlewares(delegates, config);

  return delegates;
};
