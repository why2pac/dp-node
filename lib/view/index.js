const path = require('path');
const engine = require('./engine');

module.exports = (config) => {
  const viewEngine = engine(config);

  return {
    render: (view, params, opts) => {
      opts = opts || {}; // eslint-disable-line no-param-reassign
      view = path.join(config.cfg.view, view); // eslint-disable-line no-param-reassign

      return viewEngine.render(view, params, opts);
    },
  };
};
