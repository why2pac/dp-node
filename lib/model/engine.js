const Promise = require('bluebird')
const knexQb = require('knex/lib/query/builder')
const knexRaw = require('knex/lib/raw')

// Override
const knexSelect = knexQb.prototype.select
const selectWithPrefix = (field, prefix) => {
  if (typeof field === 'object') {
    return field.map((e) => {
      const pos = e.toLowerCase().indexOf(' as ')

      return pos === -1 ? e : `${e.substr(0, pos)} AS ${prefix}_${e.substr(pos + 4)}`
    })
  }

  return field
}

// Override - select
knexQb.prototype.select = function (field, prefix) {
  if (typeof field === 'object' && prefix) {
    if (!this.selectGroups) {
      this.selectGroups = []
    }
    this.selectGroups.push(prefix)
    return knexSelect.call(this, selectWithPrefix(field, prefix))
  }

  return knexSelect.call(this, field)
}

const knexInsert = knexQb.prototype.insert
const knexUpdate = knexQb.prototype.update

const prepareParams = (config, data) => {
  if (!(config.options || {}).bindObjectAsString) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(e => prepareParams(e))
  } else if (typeof data === 'object') {
    Object.keys(data).forEach((key) => {
      if (data[key] && typeof data[key] === 'object') {
        data[key] = String(data[key])
      }
    })
  }

  return data
}

// Override - insert
knexQb.prototype.insert = function (data, returning) {
  return knexInsert.call(this, prepareParams(this.client.config, data), returning)
}

// Override - update
knexQb.prototype.update = function (a, b, c) {
  return knexUpdate.call(this, prepareParams(this.client.config, a), b, c)
}

const overridableKnexPrototype = {
  where: knexQb.prototype.where,
  orWhere: knexQb.prototype.orWhere,
  andWhere: knexQb.prototype.andWhere,
  whereIn: knexQb.prototype.whereIn,
  orWhereIn: knexQb.prototype.orWhereIn,
  whereNotIn: knexQb.prototype.whereNotIn,
  orWhereNotIn: knexQb.prototype.orWhereNotIn
}

const prepareParamsForMixed = (args) => {
  const first = args[0]
  const second = args[1]

  if (args.length === 1 && first && typeof first === 'object' && !(first instanceof knexRaw)) {
    // type of ({key: 'val'})
    args[0] = prepareParams(this.client.config, args[0])
  } else if (args.length === 2 && typeof first === 'string' && Array.isArray(second)) {
    // type of (key, 'val')
    args[1] = args[1].map(e => String(e))
  } else if (args.length === 2 && typeof first === 'string' && typeof second === 'object') {
    // type of (key, 'val')
    args[1] = String(args[1])
  } else if (args.length === 2 && Array.isArray(first) && Array.isArray(second)) {
    // type of ([key1, key2], ['val1', 'val2'])
    args[1] = second.map(e => String(e))
  }
}

Object.keys(overridableKnexPrototype).forEach((method) => {
  knexQb.prototype[method] = function () {
    if ((this.client.config.options || {}).bindObjectAsString) {
      prepareParamsForMixed(arguments)
    }

    return overridableKnexPrototype[method].apply(this, arguments)
  }
})

const db = {
  registerDsn: (dsns) => {
    if (dsns) {
      dsns.forEach((dsn) => {
        db.conn(dsn)
      })
    }
  },
  _conn: {},
  conn: (dsn) => {
    var key

    if (typeof (dsn) === 'string') {
      key = dsn
    } else if (dsn.key) {
      key = dsn.key
    } else {
      key = dsn.client + '|' + dsn.connection.database + '|' + dsn.connection.host + '|' + dsn.connection.user
    }

    if (db._conn[key]) {
      return db._conn[key]
    }

    db._conn[key] = require('knex')(dsn)

    return db._conn[key]
  },
  knex: (dsn) => {
    return db.conn(dsn)
  },
  tran: async (blocks, dsn) => {
    var results = []

    await db.conn(dsn).transaction((tran) => {
      return new Promise((resolve, reject) => {
        Promise.each(blocks, (block) => {
          var payload = block.apply(this, results)

          if (payload) {
            return tran.raw(payload[0], payload[1]).then((result) => {
              results.push(result[0])
            })
          }
        }).then(() => {
          resolve.apply(this, results)
        }).catch((error) => {
          reject(error)
        })
      })
    })

    return results
  },
  execute: async (query, params, dsn) => {
    if (dsn === undefined && params) {
      dsn = params
      params = undefined
    }

    const trans = new Promise((resolve, reject) => {
      db.conn(dsn).raw(query, params).then((result) => {
        resolve(result[0] ? result[0] : {})
      }).catch((error) => {
        reject(error)
      })
    })

    const res = await trans
    return res
  },
  rows: async (query, params, dsn) => {
    var result = await db.execute(query, params, dsn)
    return result
  },
  row: async (query, params, dsn) => {
    var result = await db.rows(query, params, dsn)
    return result && result.length >= 1 ? result[0] : null
  },
  grouping: (prefixes, row) => {
    if (row) {
      if (Array.isArray(row)) {
        return row.map(e => db.grouping(prefixes, e))
      } else {
        let obj = {}

        Object.keys(row).forEach(e => {
          prefixes = typeof prefixes === 'string' ? [prefixes] : prefixes
          let prefix = prefixes.filter(p => e.indexOf(`${p}_`) === 0)
          if (prefix.length > 0) {
            prefix = prefix[0]
            obj[prefix] = obj[prefix] || {}
            obj[prefix][e.substr(prefix.length + 1)] = row[e]
          } else {
            obj[e] = row[e]
          }
        })

        return obj
      }
    } else {
      return function (e) {
        return db.grouping(prefixes, e)
      }
    }
  },
  paginate: async (knex, page, rpp, resultMap) => {
    page = parseInt(page, 10) || 1
    rpp = parseInt(rpp, 10) || 20

    var select = knex._statements
      .filter((e) => { return e.grouping === 'columns' })
      .map((e) => { return e.value })
      .reduce((a, b) => { return b.concat(a) }, [])

    var knexCount = knex.clone().clearSelect().count('* AS cnt')

    knex.clearSelect().select(select)
    knex.limit(rpp).offset((page - 1) * rpp)

    var res = await Promise.all([knexCount, knex])

    var count = res[0][0].cnt
    var result = res[1]

    if (typeof (resultMap) === 'function') {
      result = result.map(resultMap)
    }

    return [count, result, page, rpp]
  }
}

module.exports = db
