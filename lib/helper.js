module.exports = (config) => {
  var delegate = 'helper';
  var loader = require('./loader')(delegate, config.cfg.apppath + '/helper', config);
  delegate.helper = loader;

  return loader;
};
