const fs = require('fs');
const path = require('path');
const camelize = require('camelcase');
const decamelize = require('decamelize');
const isCallable = require('is-callable');
const { isArrowFunction } = require('./functions');

const hasOwn = Object.prototype.hasOwnProperty;
const nameVariationsOf = n => [n, camelize(n), decamelize(n)];

const tryRequire = (pathloc, method) => {
  const joinedPath = path.join(pathloc, method);
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const module = require(joinedPath);
    if (module == null) throw new Error(`require() returned null or undefined: ${joinedPath}`);
    return { module, method, found: true };
  } catch (e) { // watch out for non-Object (e.g. throw null) exceptions
    const res = { module: null, method, found: !e || e.code !== 'MODULE_NOT_FOUND' };
    if (res.found) {
      throw e;
    } else {
      try {
        res.found = fs.statSync(joinedPath).isDirectory();
      } catch (e1) {
        if (!e1 || (e1.code !== 'ENOENT' && e1.code !== 'ELOOP')) throw e1;
      }
    }
    return res;
  }
};

const newHiddenRoPropDesc = value => ({
  configurable: true, enumerable: false, writable: false, value,
});
const newVisibleRwPropDesc = value => ({
  configurable: true, enumerable: true, writable: true, value,
});

/* eslint-disable no-underscore-dangle */
const fnExport = (that, exp) => {
  if (!exp) return that;

  return Object.create(that[exp], {
    _: {
      configurable: false, enumerable: false, writable: false, value: that._,
    },
    __: {
      configurable: false, enumerable: false, writable: false, value: that.__,
    },
  });
};
const fnBind = Function.prototype.bind;
/* eslint-disable comma-dangle */
const applyModule = (dest, that, module, exp) => (
  Object.entries(module).forEach(([name, val]) => (
    Object.defineProperty(dest, name, newVisibleRwPropDesc(
      isCallable(val)
        ? fnBind.apply(val, isArrowFunction(val) ? [null, fnExport(that, exp)] : [that])
        : val
    ))
  ))
);

/* eslint-enable comma-dangle */
const loadedProxies = Object.create(null);
const parentRefPropDesc = (propName, parentName) => {
  if (hasOwn.call(loadedProxies, parentName)) {
    return newHiddenRoPropDesc(loadedProxies[parentName]);
  }
  return {
    configurable: true,
    enumerable: false,
    get() {
      if (hasOwn.call(loadedProxies, parentName)) {
        const value = loadedProxies[parentName];
        Object.defineProperty(this, propName, newHiddenRoPropDesc(value));
        return value;
      }
      return undefined;
    },
  };
};
const loader = (delegate, pathloc, exportKey) => {
  let loaded;
  const proxy = new Proxy(Object.prototype, {
    get(target, method, receiver) {
      if (method in target || typeof method !== 'string'
          || !method || method === '.' || method === '..'
          || method.indexOf('/') !== -1
          || (path.sep !== '/' && method.indexOf(path.sep) !== -1)) {
        return Reflect.get(target, method, receiver);
      }
      const nameVariations = nameVariationsOf(method);

      let load = { module: null, method, found: false };
      nameVariations.some((m) => {
        const loadRes = tryRequire(pathloc, m);
        const done = loadRes.module != null;
        if (done || (!load.found && loadRes.found)) load = loadRes;
        return done;
      });

      const subDir = path.join(pathloc, load.method);
      const result = loader(delegate, subDir);
      if (load.module != null) {
        const that = Object.freeze(Object.create(delegate, {
          _: {
            configurable: false, enumerable: false, writable: false, value: result,
          },
          __: {
            configurable: false, enumerable: false, writable: false, value: loaded,
          },
        }));
        applyModule(result, that, load.module, exportKey);
      }

      const resultDesc = newVisibleRwPropDesc(result);
      nameVariations.forEach(m => Object.defineProperty(loaded, m, resultDesc));

      return result;
    },
  });

  // Cache submodules by prototyping, plus lazy cacheing of '__'
  loaded = Object.create(proxy, { __: parentRefPropDesc('__', path.dirname(pathloc)) });

  Object.defineProperty(loadedProxies, pathloc, newVisibleRwPropDesc(loaded));
  return loaded;
};

module.exports = loader;
