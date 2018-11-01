const assert = require('assert')
const fn = function () {
  this.name = 'dp-fn'
}

fn.prototype.inspect = function () {
  return 'inspect'
}

fn.prototype.toString = function () {
  return 'toString'
}

fn.prototype.toJSON = function () {
  return 'toJSON'
}

module.exports = {
  test: async (db) => {
    let knex

    try {
      knex = db.knex(global.stage)

      await knex.insert({
        ['value']: new fn()
      }).into('simple_test')

      throw Error('No!')
    } catch (e) {
      knex = db.knex(`${global.stage}Opt`)

      await knex.insert({
        ['value']: new fn()
      }).into('simple_test')
    }

    const res = await db.knex(global.stage)
      .select(['id AS id', 'value as val'])
      .from('simple_test')
      .orderBy('id', 'DESC')
      .limit(1)

    assert(res[0].val === 'toString')

    return res
  }
}
