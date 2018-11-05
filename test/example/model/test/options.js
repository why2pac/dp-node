const assert = require('assert')
const Fn = function (val) {
  this.name = 'dp-fn'
  this.val = val || ''
}

Fn.prototype.inspect = function () {
  return `inspect(${this.val})`
}

Fn.prototype.toString = function () {
  return `toString(${this.val})`
}

Fn.prototype.toJSON = function () {
  return `toJSON(${this.val})`
}

module.exports = {
  test: async (db) => {
    let knex

    try {
      knex = db.knex(global.stage)

      await knex.insert({
        'value': new Fn(0)
      }).into('simple_test')

      throw Error('No!')
    } catch (e) {
      knex = db.knex(`${global.stage}Opt`)

      await knex.insert({
        'value': new Fn(1)
      }).into('simple_test')
    }

    const res = await db.knex(global.stage)
      .select(['id AS id', 'value as val'])
      .from('simple_test')
      .orderBy('id', 'DESC')
      .limit(1)

    assert(res[0].val === 'toString(1)')

    return res
  }
}
