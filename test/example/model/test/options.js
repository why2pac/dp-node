const assert = require('assert')
const Fn = function () {
  this.name = 'dp-fn'
}

Fn.prototype.inspect = function () {
  return 'inspect'
}

Fn.prototype.toString = function () {
  return 'toString'
}

Fn.prototype.toJSON = function () {
  return 'toJSON'
}

module.exports = {
  test: async (db) => {
    let knex

    try {
      knex = db.knex(global.stage)

      await knex.insert({
        'value': new Fn()
      }).into('simple_test')

      throw Error('No!')
    } catch (e) {
      knex = db.knex(`${global.stage}Opt`)

      await knex.insert({
        'value': new Fn()
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
