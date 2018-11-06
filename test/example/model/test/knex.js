const assert = require('assert')

module.exports = {
  createTable: (db) => {
    return db.execute(`
      CREATE TABLE IF NOT EXISTS simple_test_kx (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(32) DEFAULT 'EMPTY',
        ts TIMESTAMP
      );
    `, global.stage)
  },
  test: async (db) => {
    var knex = db.knex(global.stage)

    await knex.insert({
      value: '1234',
      ts: knex.fn.now()
    }).into('simple_test_kx')

    var knexOpt = db.knex(`${global.stage}Opt`)

    await knexOpt.insert({
      value: '1234',
      ts: knex.fn.now()
    }).into('simple_test_kx')

    const row = await knex.from('simple_test_kx').orderBy('id', 'DESC').limit(1)

    await knexOpt.update({
      value: '4321',
      ts: knex.fn.now()
    })
      .where('id', row[0].id)
      .into('simple_test_kx')

    const updated = await knex.from('simple_test_kx').where('id', row[0].id).limit(1)

    assert(updated[0].value === '4321')

    return true
  }
}
