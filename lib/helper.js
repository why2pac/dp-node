const loader = require('./loader');

module.exports = (config) => {
  const delegate = {
    helper: undefined,
    cache: config.cache,
  };
  const loaded = loader(delegate, `${config.cfg.apppath}/helper`, 'helper');
  delegate.helper = loaded;

  return loaded;
};
