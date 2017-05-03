module.exports = (config) => {
    var delegate = {};
    var loader = require('./loader')(delegate, config.cfg.apppath + '/helper');
    delegate.helper = loader;

    return loader;
};
