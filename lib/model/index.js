module.exports = (config) => {
  var engine = require('./engine')
  engine.registerDsn(config.cfg.databaseDsn)

  var delegate = {
    knex: engine.knex,
    row: engine.row,
    rows: engine.rows,
    tran: engine.tran,
    execute: engine.execute,
    paginate: engine.paginate,
    grouping: engine.grouping,
    helper: config.helper
  }

  // Assign engine when test mode enabled.
  if (global.isTest) {
    global.__dpModelEngine__ = engine
  }

  var loader = require('../loader')(delegate, config.cfg.apppath + '/model')
  delegate.model = loader

  return loader
}
