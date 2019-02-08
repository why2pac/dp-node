'use strict';

const engine = require('./engine');

module.exports = (config) => {
  engine.registerDsn(config.cfg.databaseDsn);

  const delegate = {
    knex: engine.knex,
    row: engine.row,
    rows: engine.rows,
    tran: engine.tran,
    execute: engine.execute,
    paginate: engine.paginate,
    grouping: engine.grouping,
    helper: config.helper,
    cache: config.cache,
    model: undefined,
  };

  // Assign engine when test mode enabled.
  if (global.isTest) {
    global.__dpModelEngine__ = engine; // eslint-disable-line no-underscore-dangle
  }

  // eslint-disable-next-line global-require
  const loader = require('../loader')(delegate, `${config.cfg.apppath}/model`);
  delegate.model = loader;

  return loader;
};
