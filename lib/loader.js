const fs = require('fs');
const camelize = require('camelcase');
const decamelize = require('decamelize');

var loader = (delegate, path, parent, config) => {
  var loaded = parent || {};
  var proxy = new Proxy(loaded, {
    get: (target, method) => {
      if (method in target) {
        return target[method];
      }

      if (typeof method == 'string') {
        var ccMethod = camelize(method);
        var dccMethod = decamelize(method);

        try {
          var included;

          try {
            included = require(path + '/' + method);
          }
          catch(e) {
            var pathExists;
            try {
              pathExists = fs.statSync(path + '/' + method + '.js').isFile();
            }
            catch (_) {
              try {
                pathExists = fs.statSync(path + '/' + method + '/index.js').isFile();
              }
              catch (__) {
                pathExists = false;
              }
            }

            if (pathExists && !(!pathExists && e.code === 'MODULE_NOT_FOUND')) {
              console.error(e);
            }

            included = require(path + '/' + dccMethod);
            method = dccMethod;
          }

          var closured = {};

          Object.keys(included).forEach((fn) => {
            closured[fn] = (...args) => {
              if (typeof(delegate) === 'string') {
                return included[fn].apply(this, [config[delegate]].concat(args));
              }
              else {
                return included[fn].apply(this, [delegate].concat(args));
              }
            };
          });

          loaded[method] = loader(delegate, path + '/' + method, closured, config);
          loaded[ccMethod] = loaded[method];

          return loaded[method];
        }
        catch(_) {
          loaded[method] = loader(delegate, path + '/' + method, undefined, config);
          loaded[ccMethod] = loaded[method];

          return loaded[method];
        }
      }

      loaded[method] = null;
      return null;
    }
  });

  return proxy;
};

module.exports = (delegate, path, config) => {
  return loader(delegate, path, undefined, config);
};
