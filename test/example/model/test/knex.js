const assert = require('assert');

module.exports = {
  createTable: (db) => db.execute(`
      CREATE TABLE IF NOT EXISTS simple_test_knex (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(128) DEFAULT 'EMPTY',
        ts TIMESTAMP
      );
    `, global.stage),
  test: async (db) => {
    const knex = db.knex(global.stage);
    const knexOpt = db.knex(`${global.stage}Opt`);

    await knex.insert({
      value: '1234',
      ts: knex.fn.now(),
    }).into('simple_test_knex');

    await knex.insert({
      value: Buffer.from('test'),
      ts: new Date(),
    }).into('simple_test_knex');

    await knexOpt.insert({
      value: Buffer.from('test'),
      ts: new Date(),
    }).into('simple_test_knex');

    const date = new Date();
    date.setYear(2001);

    const dateStr = `${date.toISOString().slice(0, 10)} 00:00:00`;

    await knexOpt.insert({
      value: Buffer.from('test-date'),
      ts: dateStr,
    }).into('simple_test_knex');

    const rowDate = await knex
      .from('simple_test_knex')
      .where('ts', dateStr)
      .orderBy('id', 'DESC')
      .limit(1);

    assert(date.getFullYear() === (new Date(rowDate[0].ts)).getFullYear());

    await knex
      .from('simple_test_knex')
      .where('ts', dateStr)
      .orderBy('id', 'DESC')
      .limit(1);

    const d = new Date();

    await knex.insert({
      value: d,
      ts: knex.fn.now(),
    }).into('simple_test_knex');

    await knex.insert({
      value: d,
      ts: knex.fn.now(),
    }).into('simple_test_knex');

    await knexOpt.insert({
      value: d,
      ts: knex.fn.now(),
    }).into('simple_test_knex');

    const resD = await knex
      .from('simple_test_knex')
      .where('value', d)
      .orderBy('id', 'DESC');

    assert(resD.length === 3);

    const resStrD = await knex
      .from('simple_test_knex')
      .where('value', String(d))
      .orderBy('id', 'DESC');

    assert(resStrD.length === 0);

    const resOptD = await knexOpt
      .from('simple_test_knex')
      .where('value', d)
      .orderBy('id', 'DESC');

    assert(resOptD.length === 3);

    const resStrOptD = await knexOpt
      .from('simple_test_knex')
      .where('value', String(d))
      .orderBy('id', 'DESC');

    assert(resStrOptD.length === 0);

    await knexOpt.insert({
      value: '1234',
      ts: knex.fn.now(),
    }).into('simple_test_knex');

    const row = await knex.from('simple_test_knex').orderBy('id', 'DESC').limit(1);

    await knexOpt.update({
      value: '4321',
      ts: knex.fn.now(),
    })
      .where('id', row[0].id)
      .into('simple_test_knex');

    const updated = await knex.from('simple_test_knex').where('id', row[0].id).limit(1);

    assert(updated[0].value === '4321');

    return true;
  },
};
