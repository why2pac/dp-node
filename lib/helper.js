const loader = require('./loader');

module.exports = (config) => {
  const delegate = 'helper';
  const loaded = loader(delegate, `${config.cfg.apppath}/helper`, config);
  delegate.helper = loaded;

  return loaded;
};
