module.exports = {
    conn: (connection) => {
        throw Error('Not Implemented, conn.');
    },
    get: (conn, key, val, ttl) => {
        throw Error('Not Implemented, get.');
    },
    set: (conn, key, val, ttl) => {
        throw Error('Not Implemented, set.');
    },
    del: (conn, key) => {
        throw Error('Not Implemented, del.');
    },
    expire: (conn, key, ttl) => {
        throw Error('Not Implemented, expire.');
    },
    ttl: (conn, key) => {
        throw Error('Not Implemented, ttl.');
    }
};
