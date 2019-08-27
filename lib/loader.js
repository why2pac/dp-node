/* eslint no-use-before-define: ["error", { "functions": false }] */
const fs = require('fs');
const path = require('path');
const camelize = require('camelcase');
const decamelize = require('decamelize');
const isCallable = require('is-callable');
const { isArrowFunction } = require('./functions');

const tryRequire = (pathloc, method) => {
  const joinedPath = path.join(pathloc, method);
  const res = { module: null, method, found: false };
  try {
    res.module = require(joinedPath);
    res.found = true;
  } catch (e) { // watch out for non-Object (e.g. throw null) exceptions
    if (!e || e.code !== 'MODULE_NOT_FOUND') throw e;
  }
  if (res.found) {
    if (res.module == null) {
      throw new Error(`require(${JSON.stringify(joinedPath)}) returned ${res.module}`);
    }
  } else {
    try {
      res.found = fs.statSync(joinedPath).isDirectory();
    } catch (e) {
      if (!e || (e.code !== 'ENOENT' && e.code !== 'ELOOP')) throw e;
    }
  }
  return res;
};

const newHiddenRoPropDesc = (value) => ({
  value, writable: false, enumerable: false, configurable: true,
});
const newVisibleRwPropDesc = (value) => ({
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
const proxy = new Proxy(Object.create(Object.prototype, {
  constructor: newHiddenRoPropDesc(Loader),
  [Symbol.toStringTag]: newHiddenRoPropDesc('Loader'),
}), {
  get(target, method, receiver) {
    if (proxy === receiver || typeof receiver !== 'object'
        || method in target || typeof method !== 'string'
        || !method || method === '.' || method === '..'
        || method.indexOf('/') !== -1
        || (path.sep !== '/' && method.indexOf(path.sep) !== -1)) {
      return ReflectGet(target, method, receiver);
    }
    let loaded = receiver;
    for (;;) {
      const proto = getPrototypeOf(loaded);
      if (proto === proxy) break;
      if (proto == null) return ReflectGet(target, method, receiver);
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
    const result = Loader(delegate, subDir);
    if (load.module != null) {
      const props = {
        _: {
          value: result, writable: false, enumerable: false, configurable: false,
        },
        __: {
          value: loaded, writable: false, enumerable: false, configurable: false,
        },
      };
      const that = Object.preventExtensions(Object.create(delegate, props));
      const it = exportKey == null ? that
        : Object.preventExtensions(Object.create(delegate[exportKey], props));
      const argsNormal = [that];
      const argsArrow = [null, it];
      applyModule(result, load.module, argsNormal, argsArrow);
    }

    const resultDesc = newVisibleRwPropDesc(result);
    nameVariations.forEach((m) => Object.defineProperty(loaded, m, resultDesc));

    return result;
  },
});
function Loader(delegate, pathloc, exportKey) {
  pathloc = `${pathloc}`; // eslint-disable-line no-param-reassign
  // Cache submodules by prototyping, plus lazy cacheing of '__'
  const props = {
    [symDelegate]: newHiddenRoPropDesc(delegate),
    [symPath]: newHiddenRoPropDesc(pathloc),
    [symExportKey]: newHiddenRoPropDesc(exportKey),
    __: parentRefPropDesc('__', path.dirname(pathloc)),
  };
  let loaded;
  if (this && typeof this === 'object' && Object.getPrototypeOf(this) === proxy) {
    loaded = this;
    Object.defineProperties(loaded, props);
  } else {
    loaded = Object.create(proxy, props);
  }

  loadedProxies[pathloc] = loaded;
  return loaded;
}
Object.defineProperty(Loader, 'prototype', { value: Loader, writable: false });
module.exports = Loader;
