var loader = (delegate, path, parent) => {
    var loaded = parent || {};
    var proxy = new Proxy(loaded, {
        get: (target, method) => {
            if (method in target) {
                return target[method];
            }

            if (typeof method == 'string') {
                try {
                    var included = require(path + '/' + method);
                    var closured = {};

                    Object.keys(included).forEach((fn) => {
                        closured[fn] = (...args) => {
                            if (delegate === false) {
                                return included[fn].apply(this, args);
                            }
                            else {
                                return included[fn].apply(this, [delegate].concat(args));
                            }
                        };
                    });

                    loaded[method] = loader(delegate, path + '/' + method, closured);
                    return loaded[method];
                }
                catch(_) {
                    loaded[method] = loader(delegate, path + '/' + method);
                    return loaded[method];
                }
            }

            loaded[method] = null;
            return null;
        }
    });

    return proxy;
};

module.exports = (delegate, path) => {
    return loader(delegate, path);
};
