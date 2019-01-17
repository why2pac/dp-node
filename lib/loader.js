const fs = require('fs');
const camelize = require('camelcase');
const decamelize = require('decamelize');
const isCallable = require('is-callable');
const { isArrowFunction } = require('./functions');

const hasOwn = Object.prototype.hasOwnProperty;
const nameVariationsOf = n => [n, camelize(n), decamelize(n)];

const tryRequire = (pathloc, method) => {
  const joinedPath = pathloc ? `${pathloc}/${method}` : method;
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const module = require(joinedPath);
    return { module, method, found: true };
  } catch (e) { // watch out for non-Object (e.g. throw null) exceptions
    const res = { module: null, method, found: !e || e.code !== 'MODULE_NOT_FOUND' };
    if (res.found) {
      res.error = e;
    } else {
      try {
        res.found = fs.statSync(joinedPath).isDirectory();
      } catch (e1) {
        if (!e1 || (e1.code !== 'ENOENT' && e1.code !== 'ELOOP')) res.error = e1;
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

const isKey = n => (typeof n === 'string' || typeof n === 'symbol');
const applyModule = (dest, owner, delegate, config, module) => (
  Object.entries(module || {}).forEach(([name, orig]) => {
    let value = orig;

    if (isCallable(value)) {
      const isThisArrowFunction = isArrowFunction(orig);
      value = (...args) => {
        const that = isKey(delegate) ? config[delegate] : delegate;
        that._ = dest;
        that.__ = owner; // eslint-disable-line no-underscore-dangle

        if (isThisArrowFunction) args.unshift(that);
        return orig.apply(that, args);
      };
    }

    Object.defineProperty(dest, name, newVisibleRwPropDesc(value));
  }));

const loadedProxies = Object.create(null);
const parentRefPropDesc = (propName, pathloc) => {
  const idx = pathloc.lastIndexOf('/');
  const parentName = idx > 0 ? pathloc.substring(0, idx) : '/'.charAt(-idx);
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
const loader = (delegate, pathloc, config) => {
  let loaded;
  const proxy = new Proxy(Object.prototype, {
    get(target, method, receiver) {
      if (method in target || typeof method !== 'string'
          || method.indexOf('/') !== -1) {
        return Reflect.get(target, method, receiver);
      }
      const nameVariations = nameVariationsOf(method);

      let load = { module: null, method, found: false };
      nameVariations.find((m) => {
        const loadRes = tryRequire(pathloc, m);
        const done = loadRes.module || hasOwn.call(loadRes, 'error');
        if (done || (!load.found && loadRes.found)) {
          load = loadRes;
        }
        return done;
      });
      if (hasOwn.call(load, 'error')) throw load.error;

      const subDir = (pathloc ? `${pathloc}/` : '') + load.method;
      const result = loader(delegate, subDir, config);
      applyModule(result, loaded, delegate, config, load.module);

      const resultDesc = newVisibleRwPropDesc(result);
      nameVariations.forEach(m => Object.defineProperty(loaded, m, resultDesc));

      return result;
    },
  });

  // Cache submodules by prototyping, plus lazy cacheing of '__'
  loaded = Object.create(proxy, { __: parentRefPropDesc('__', pathloc) });

  Object.defineProperty(loadedProxies, pathloc, newVisibleRwPropDesc(loaded));
  return loaded;
};

module.exports = loader;
