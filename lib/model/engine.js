const Promise = require('bluebird');

const db = {
    registerDsn: (dsns) => {
        dsns.forEach((dsn) => {
            db.conn(dsn);
        })
    },
    _conn: {},
    conn: (dsn) => {
        var key;

        if (dsn.key) {
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
    tran: (blocks, dsn) => {
        return db.conn(dsn).transaction((tran) => {
            var results = [];

            return await(new Promise((resolve, reject) => {
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
            }))
        })
    },
    execute: (query, params, dsn) => {
        if (dsn == undefined && params) {
            dsn = params;
            params = undefined;
        }

        return db.conn(dsn).raw(query, params)
    },
    rows: (query, params, dsn) => {
        return await(new Promise((resolve, reject) => {
            db.execute(query, params, dsn).then((results) => {
                resolve(results[0] ? results[0] : [], results[1])
            }).catch((error) => {
                reject(error)
            })
        }))
    },
    row: (query, params, dsn) => {
        return await(new Promise((resolve, reject) => {
            db.rows(query, params, dsn).then((rows, conn) => {
                resolve(rows && rows.length >= 1 ? rows[0] : {}, conn)
            }).catch((error) => {
                reject(error)
            })
        }))
    }
};

module.exports = db;
