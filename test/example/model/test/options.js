'use strict';

const assert = require('assert');

const Fn = function Fn(val) {
  this.name = 'dp-fn';
  this.val = val || '';
};

Fn.prototype.inspect = function inspect() {
  return `inspect(${this.val})`;
};

Fn.prototype.toString = function toString() {
  return `toString(${this.val})`;
};

Fn.prototype.toJSON = function toJSON() {
  return `toJSON(${this.val})`;
};

module.exports = {
  test: async (db) => {
    let knex;

    try {
      knex = db.knex(global.stage);

      await knex.insert({
        value: new Fn(0),
      }).into('simple_test');

      throw Error('No!');
    } catch (e) {
      knex = db.knex(`${global.stage}Opt`);

      await knex.insert({
        value: new Fn(1),
      }).into('simple_test');
    }

    const res = await db.knex(global.stage)
      .select(['id AS id', 'value as val'])
      .from('simple_test')
      .orderBy('id', 'DESC')
      .limit(1);

    assert(res[0].val === 'toString(1)');

    await db.knex(global.stage).from('simple_test').where(true).delete();

    await db.knex(`${global.stage}Opt`).insert({
      value: new Fn(1000),
    }).into('simple_test');

    await db.knex(`${global.stage}Opt`).insert({
      value: new Fn(2000),
    }).into('simple_test');

    await db.knex(`${global.stage}Opt`).insert({
      value: new Fn(3000),
    }).into('simple_test');

    await db.knex(`${global.stage}Opt`).insert({
      value: new Fn(4000),
    }).into('simple_test');

    try {
      await db.knex(global.stage)
        .count('* as cnt')
        .from('simple_test')
        .whereIn('value', [new Fn(1000), new Fn(1004)]);

      throw Error('No!');
    } catch (_) {
      // dismiss
    }

    assert((await db.knex(`${global.stage}Opt`)
      .count('* as cnt')
      .from('simple_test')
      .where('value', new Fn(1000)))[0].cnt === 1);

    assert((await db.knex(`${global.stage}Opt`)
      .count('* as cnt')
      .from('simple_test')
      .whereIn('value', [new Fn(1000), new Fn(1004)]))[0].cnt === 1);

    assert((await db.knex(`${global.stage}Opt`)
      .count('* as cnt')
      .from('simple_test')
      .whereNotIn('value', [new Fn(1000), new Fn(2000)]))[0].cnt === 2);

    assert((await db.knex(`${global.stage}Opt`)
      .count('* as cnt')
      .from('simple_test')
      .whereNotIn('value', [new Fn(1000)])
      .orWhere('value', new Fn(2000)))[0].cnt === 3);

    assert((await db.knex(`${global.stage}Opt`)
      .count('* as cnt')
      .from('simple_test')
      .whereNotIn('value', [new Fn(1000)])
      .andWhere('value', new Fn(2000)))[0].cnt === 1);

    assert((await db.knex(`${global.stage}Opt`)
      .count('* as cnt')
      .from('simple_test')
      .whereIn('value', [new Fn(1000)])
      .orWhereIn('value', [new Fn(2000)]))[0].cnt === 2);

    assert((await db.knex(`${global.stage}Opt`)
      .count('* as cnt')
      .from('simple_test')
      .whereIn('value', [new Fn(1000)])
      .orWhereNotIn('value', [new Fn(2000)]))[0].cnt === 3);

    await db.knex(global.stage).from('simple_test').where(true).delete();

    try {
      knex = db.knex(global.stage);

      await knex.batchInsert('simple_test', [1, 2, 3, 4, 5].map((e) => ({
        value: new Fn(e),
      })));

      throw Error('No!');
    } catch (e) {
      knex = db.knex(`${global.stage}Opt`);

      await knex.batchInsert('simple_test', [1, 2, 3, 4, 5].map((ee) => ({
        value: new Fn(ee),
      })));
    }

    const rows = await db.knex(global.stage).from('simple_test').orderBy('id', 'desc').limit(5);

    assert(rows.length === 5 && rows[0].value === 'toString(5)');

    return true;
  },
};
