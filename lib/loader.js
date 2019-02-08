'use strict';

/* eslint-disable no-underscore-dangle */
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
    if (module == null) throw new Error(`require(${JSON.stringify(joinedPath)}) returned ${module}`);
    return { module, method, found: true };
  } catch (e) { // watch out for non-Object (e.g. throw null) exceptions
    if (!e || e.code !== 'MODULE_NOT_FOUND') throw e;
    const res = { module: null, method, found: false };
    try {
      res.found = fs.statSync(joinedPath).isDirectory();
    } catch (x) {
      if (!x || (x.code !== 'ENOENT' && x.code !== 'ELOOP')) throw x;
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

const fnBind = Function.prototype.bind;
/* eslint-disable comma-dangle */
const applyModule = (dest, module, argsNormal, argsArrow) => (
  Object.entries(module).forEach(([name, val]) => (
    Object.defineProperty(dest, name, newVisibleRwPropDesc(
      !isCallable(val) ? val
        : fnBind.apply(val, isArrowFunction(val) ? argsArrow : argsNormal)
    ))
  ))
);

/* eslint-enable comma-dangle */
const loadedProxies = Object.create(null);
const parentRefPropDesc = (propName, parentName) => (
  hasOwn.call(loadedProxies, parentName) ? newHiddenRoPropDesc(loadedProxies[parentName]) : {
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
  }
);
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
        const props = {
          _: {
            configurable: false, enumerable: false, writable: false, value: result,
          },
          __: {
            configurable: false, enumerable: false, writable: false, value: loaded,
          },
        };
        const that = Object.freeze(Object.create(delegate, props));
        const it = exportKey == null ? that
          : Object.freeze(Object.create(delegate[exportKey], props));
        const argsNormal = [that];
        const argsArrow = [null, it];
        applyModule(result, load.module, argsNormal, argsArrow);
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
