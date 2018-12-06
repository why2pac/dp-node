const fs = require('fs');
const camelize = require('camelcase');
const decamelize = require('decamelize');
const isCallable = require('is-callable');
const isArrowFunction = require('./functions').isArrowFunction; // eslint-disable-line prefer-destructuring

const isFile = (path) => {
  try {
    return fs.statSync(path).isFile();
  } catch (_) {
    return false;
  }
};

const isDir = (path) => {
  try {
    return fs.statSync(path).isDirectory();
  } catch (_) {
    return false;
  }
};

const tryRequire = (path, method) => {
  try {
    const required = require(`${path}/${method}`) // eslint-disable-line
    return [required, method, null, true];
  } catch (e) {
    const isFileExists = isFile(`${path}/${method}.js`)
      || isFile(`${path}/${method}/index.js`);
    const isLoadable = isFileExists || isDir(`${path}/${method}`);
    return [null, method, isFileExists ? e : null, isLoadable];
  }
};

const loadize = load => ({
  module: load[0],
  method: load[1],
  error: load[2],
});
const tryRequires = (path, method) => {
  // Requested
  const loadReq = tryRequire(path, method);

  if (loadReq[0] || loadReq[2]) {
    return loadize(loadReq);
  }

  // Decamelized
  const loadDec = tryRequire(path, decamelize(method));

  if (loadDec[0] || loadDec[2]) {
    return loadize(loadDec);
  }

  // Camelized
  const loadCam = tryRequire(path, camelize(method));

  if (loadCam[0] || loadCam[2]) {
    return loadize(loadCam);
  }

  if (loadReq[3]) {
    method = loadReq[1]; // eslint-disable-line
  } else if (loadDec[3]) {
    method = loadDec[1]; // eslint-disable-line
  } else if (loadCam[3]) {
    method = loadCam[1]; // eslint-disable-line
  }

  return loadize([null, method, null]);
};

const loader = (delegate, path, parent, config) => {
  const loaded = parent || {};
  const proxy = new Proxy(loaded, {
    get: (target, method) => {
      if (method in target) {
        return target[method];
      }

      if (typeof method === 'string') {
        const load = tryRequires(path, method);
        const ccMethod = camelize(method);
        const dccMethod = decamelize(method);

        if (load.error) {
          throw load.error;
        } else if (load.module) {
          const closured = {};

          Object.keys(load.module).forEach((fn) => {
            let isThisArrowFunction = null;

            if (!isCallable(load.module[fn])) {
              closured[fn] = load.module[fn];
            } else {
              closured[fn] = (...args) => {
                const func = load.module[fn];
                const that = typeof delegate === 'string' ? config[delegate] : delegate;
                that._ = loaded[method];
                that.__ = loaded; // eslint-disable-line no-underscore-dangle

                if (isThisArrowFunction === null) {
                  isThisArrowFunction = isArrowFunction(func);
                }

                if (!isThisArrowFunction) {
                  return func.apply(that, args);
                }
                return func.apply(this, [that].concat(args));
              };
            }
          });

          loaded[method] = loader(delegate, `${path}/${load.method}`, closured, config);
          loaded[ccMethod] = loaded[method];
          loaded[dccMethod] = loaded[method];

          return loaded[method];
        } else {
          const loadablePath = load.method || method;
          loaded[method] = loader(delegate, `${path}/${loadablePath}`, undefined, config);
          loaded[ccMethod] = loaded[method];
          loaded[dccMethod] = loaded[method];

          return loaded[method];
        }
      }

      loaded[method] = null;
      return null;
    },
  });

  return proxy;
};

module.exports = (delegate, path, config) => loader(delegate, path, undefined, config);
