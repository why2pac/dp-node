'use strict';

/* eslint no-use-before-define: ["error", { "functions": false }] */
const fs = require('fs');
const path = require('path');
const camelize = require('camelcase');
const decamelize = require('decamelize');
const isCallable = require('is-callable');
const { isArrowFunction } = require('./functions');

const tryRequire = (pathloc, method) => {
  const joinedPath = path.join(pathloc, method);
  try {
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
  value, writable: false, enumerable: false, configurable: true,
});
const newVisibleRwPropDesc = value => ({
  value, writable: true, enumerable: true, configurable: true,
});

const fnBind = Function.prototype.bind;
const applyModule = (dest, module, argsNormal, argsArrow) => (
  Object.entries(module).forEach(([name, val]) => (
    Object.defineProperty(dest, name, newVisibleRwPropDesc(
      !isCallable(val) ? val
        : fnBind.apply(val, isArrowFunction(val) ? argsArrow : argsNormal)
    ))
  ))
);

const loadedProxies = Object.create(null);
const parentRefPropDesc = (propName, parentName) => (
  parentName in loadedProxies ? newHiddenRoPropDesc(loadedProxies[parentName]) : {
    get() {
      if (parentName in loadedProxies) {
        const value = loadedProxies[parentName];
        Object.defineProperty(this, propName, newHiddenRoPropDesc(value));
        return value;
      }
      return undefined;
    },
    enumerable: false,
    configurable: true,
  }
);

const ReflectGet = Reflect.get;
const { getPrototypeOf } = Object;
const symDelegate = Symbol('dp-node.delegate');
const symPath = Symbol('dp-node.path');
const symExportKey = Symbol('dp-node.exportKey');
const proxy = new Proxy(Object.prototype, {
  get(target, method, receiver) {
    if (proxy === receiver || method in target || typeof method !== 'string'
        || !method || method === '.' || method === '..'
        || method.indexOf('/') !== -1
        || (path.sep !== '/' && method.indexOf(path.sep) !== -1)) {
      return ReflectGet(target, method, receiver);
    }
    let loaded = receiver;
    for (;;) {
      const proto = getPrototypeOf(loaded);
      if (proto === proxy) break;
      loaded = proto;
    }

    const { [symDelegate]: delegate, [symPath]: pathloc, [symExportKey]: exportKey } = loaded;
    const nameVariations = Object.keys({
      [method]: 1,
      [camelize(method)]: 1,
      [decamelize(method)]: 1,
    });

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
          value: result, writable: false, enumerable: false, configurable: false,
        },
        __: {
          value: loaded, writable: false, enumerable: false, configurable: false,
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
function loader(delegate, pathloc, exportKey) {
  // Cache submodules by prototyping, plus lazy cacheing of '__'
  const loaded = Object.create(proxy, {
    [symDelegate]: newHiddenRoPropDesc(delegate),
    [symPath]: newHiddenRoPropDesc(pathloc),
    [symExportKey]: newHiddenRoPropDesc(exportKey),
    __: parentRefPropDesc('__', path.dirname(pathloc)),
  });

  Object.defineProperty(loadedProxies, pathloc, newVisibleRwPropDesc(loaded));
  return loaded;
}
module.exports = loader;
