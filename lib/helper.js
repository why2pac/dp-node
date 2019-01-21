const loader = require('./loader');

module.exports = (config) => {
  const delegate = {
    helper: undefined,
  };
  const loaded = loader(delegate, `${config.cfg.apppath}/helper`);
  delegate.helper = loaded;

  return loaded;
};
