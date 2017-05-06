const Promise = require('bluebird');

const db = {
    registerDsn: (dsns) => {
        if (dsns) {
            dsns.forEach((dsn) => {
                db.conn(dsn);
            })
        }
    },
    _conn: {},
    conn: (dsn) => {
        var key;

        if (typeof(dsn) == 'string') {
            key = dsn;
        }
        else if (dsn.key) {
            key = dsn.key;
        }
        else {
            key = dsn.client + '|' + dsn.connection.database + '|' + dsn.connection.host + '|' + dsn.connection.user;
        }

        if (db._conn[key]) {
            return db._conn[key];
        }

        db._conn[key] = require('knex')(dsn);
        return db._conn[key];
    },
    knex: (dsn) => {
        return db.conn(dsn);
    },
    tran: (blocks, dsn) => {
        return await(db.conn(dsn).transaction((tran) => {
            var results = [];

            return new Promise((resolve, reject) => {
                Promise.each(blocks, (block) => {
                    var payload = block.apply(this, results)

                    if (payload) {
                        return tran.raw(payload[0], payload[1]).then((result) => {
                            results.push(result[0])
                        });
                    }
                }).then(() => {
                    resolve.apply(this, results);
                }).catch((error) => {
                    reject(error)
                })
            })
        }))
    },
    execute: (query, params, dsn) => {
        if (dsn == undefined && params) {
            dsn = params;
            params = undefined;
        }

        return await(new Promise((resolve, reject) => {
            db.conn(dsn).raw(query, params).then((result) => {
                resolve(result[0] ? result[0] : {})
            }).catch((error) => {
                reject(error)
            })
        }))
    },
    rows: (query, params, dsn) => {
        var result = db.execute(query, params, dsn);
        return result;
    },
    row: (query, params, dsn) => {
        var result = db.rows(query, params, dsn);
        return result && result.length >= 1 ? result[0] : null;
    },
    paginate: (knex, page, rpp, resultMap) => {
        page = parseInt(page, 10) || 1;
        rpp = parseInt(rpp, 10) || 20;

        var select = (knex._statements.filter((e) => { return e.grouping == 'columns' ? e : null })[0] || {}).value;
        var count = await(knex.clearSelect().count('* AS cnt'))[0].cnt;

        knex.clearSelect().select(select)
        knex.limit(rpp).offset((page - 1) * rpp)

        var result = await(knex);

        if (typeof(resultMap) == 'function') {
            result = result.map(resultMap);
        }

        return [count, result, page, rpp];
    }
};

module.exports = db;
