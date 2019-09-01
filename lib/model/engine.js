/* eslint-disable prefer-rest-params */

'use strict';

const Promise = require('bluebird');
const knexQb = require('knex/lib/query/builder');
const knexRaw = require('knex/lib/raw');

// Override
const { getPrototypeOf } = Object;

// Override - select
const AS_RE = /\bas\s*[\s`'"]/i;
const symSelectGroups = Symbol('dp-node.selectGroups');
knexQb.prototype.select = Object.setPrototypeOf(function select() {
  if (arguments.length === 2 && typeof arguments[0] === 'object' && arguments[1]) {
    const p = `${arguments[1]}`;
    (this[symSelectGroups] || (this[symSelectGroups] = [])).push(p);
    const replacement = `$&${p.replace('$', '$$$$')}_`;
    arguments[0] = arguments[0].map((e) => e.replace(AS_RE, replacement));
  }

  return getPrototypeOf(select).apply(this, arguments);
}, knexQb.prototype.select);

const prepareParam = (data) => {
  if (data && typeof data === 'object') {
    const ignorable = (false
      || data instanceof knexRaw
      || data instanceof Date
      || data instanceof Buffer
    );

    if (!ignorable) {
      return String(data);
    }
  }

  return data;
};

const prepareParams = (config, data) => {
  if (!(config.options || {}).bindObjectAsString) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((e) => prepareParams(config, e));
  }
  if (typeof data === 'object') {
    const obj = {};
    Object.keys(data).forEach((key) => {
      let value = data[key];
      if (value && typeof value === 'object') {
        value = prepareParam(value);
      }
      Object.defineProperty(obj, key, {
        value, writable: true, enumerable: true, configurable: true,
      });
    });
    return obj;
  }

  return data;
};

// Override - insert
knexQb.prototype.insert = Object.setPrototypeOf(function insert(_values, _returning) {
  if (arguments.length > 0) {
    arguments[0] = prepareParams(this.client.config, arguments[0]);
  }
  return getPrototypeOf(insert).apply(this, arguments);
}, knexQb.prototype.insert);

// Override - update
knexQb.prototype.update = Object.setPrototypeOf(function update(_values, _returning) {
  if (arguments.length > 0) {
    arguments[0] = prepareParams(this.client.config, arguments[0]);
  }
  return getPrototypeOf(update).apply(this, arguments);
}, knexQb.prototype.update);

const overridableKnexMethods = [
  'where',
  'orWhere',
  'andWhere',
  'whereIn',
  'orWhereIn',
  'whereNotIn',
  'orWhereNotIn',
];

overridableKnexMethods.forEach((method) => {
  function override() {
    if ((this.client.config.options || {}).bindObjectAsString) {
      const n = arguments.length;
      const first = n > 0 ? arguments[0] : undefined;
      const second = n > 1 ? arguments[1] : undefined;
      if (n === 1 && first && typeof first === 'object' && !(first instanceof knexRaw)) {
        // type of ({key: 'val'})
        arguments[0] = prepareParams(this.client.config, first);
      } else if (n === 2 && typeof first === 'string' && Array.isArray(second)) {
        // type of (key, ['val'])
        arguments[1] = second.map((e) => prepareParam(e));
      } else if (n === 2 && typeof first === 'string' && typeof second === 'object') {
        // type of (key, 'val')
        arguments[1] = prepareParam(second);
      } else if (n === 2 && Array.isArray(first) && Array.isArray(second)) {
        // type of ([key1, key2], ['val1', 'val2'])
        arguments[1] = second.map((e) => prepareParam(e));
      }
    }

    return getPrototypeOf(override).apply(this, arguments);
  }
  const sup = knexQb.prototype[method];
  Object.setPrototypeOf(override, sup); // XXX
  Object.defineProperties(override, {
    name: Object.getOwnPropertyDescriptor(sup, 'name'),
    length: Object.getOwnPropertyDescriptor(sup, 'length'),
  });
  knexQb.prototype[method] = override;
});

const db = {
  registerDsn: (dsns) => {
    if (dsns) dsns.forEach((dsn) => db.conn(dsn));
  },
  _conn: Object.create(null),
  conn: (dsn) => {
    let key;

    if (typeof dsn === 'string') {
      key = dsn;
    } else if (dsn.key) {
      ({ key } = dsn);
    } else {
      key = JSON.stringify([
        dsn.client,
        dsn.connection.database,
        dsn.connection.host,
        dsn.connection.user,
      ]);
    }

    let v = db._conn[key];
    if (v == null) {
      v = require('knex')(dsn);
      db._conn[key] = v;
    }

    return v;
  },
  knex: (dsn) => db.conn(dsn),
  tran: (blocks, dsn) => {
    const results = [];

    return db
      .conn(dsn)
      .transaction((tran) => Promise.each(blocks, (block) => {
        const payload = block.apply(this, results);

        if (payload) {
          return tran.raw(...payload).then(([item]) => {
            results.push(item);
          });
        }

        return null;
      }))
      .then((_) => results);
  },
  execute: (query, params, dsn) => {
    if (typeof dsn === 'undefined' && params) {
      dsn = params; // eslint-disable-line no-param-reassign
      params = undefined; // eslint-disable-line no-param-reassign
    }

    return db.conn(dsn).raw(query, params).then(([r]) => (r || {}));
  },
  rows: (query, params, dsn) => db.execute(query, params, dsn),
  row: (query, params, dsn) => (
    db.rows(query, params, dsn).then((r) => (r && r.length >= 1 ? r[0] : null))),
  grouping: (prefixes, row) => {
    if (typeof row !== 'undefined') {
      if (Array.isArray(row)) {
        return row.map((e) => db.grouping(prefixes, e));
      }
      const obj = {};

      Object.keys(row).forEach((e) => {
        // eslint-disable-next-line no-param-reassign
        prefixes = typeof prefixes === 'string' ? [prefixes] : prefixes;

        const prefix = prefixes.find((p) => e.startsWith(`${p}_`));

        if (typeof prefix !== 'undefined') {
          obj[prefix] = obj[prefix] || {};
          obj[prefix][e.substr(prefix.length + 1)] = row[e];
        } else {
          obj[e] = row[e];
        }
      });

      return obj;
    }
    // currying
    return function grouping(e) {
      return db.grouping(prefixes, e);
    };
  },
  paginate: (knex, page, rpp, mapper) => {
    switch (typeof mapper) {
      case 'undefined': case 'function': break;
      default: throw new TypeError('optional argument (mapper) must be a function');
    }
    page = parseInt(page, 10) || 1; // eslint-disable-line no-param-reassign
    rpp = parseInt(rpp, 10) || 20; // eslint-disable-line no-param-reassign

    const select = knex._statements
      .reduce((a, e) => (e.grouping === 'columns' ? e.value.concat(a) : a), []);

    const knexCount = knex.clone().clearSelect().count('* AS dpncnt');

    knex.clearSelect().select(select);
    knex.limit(rpp).offset((page - 1) * rpp);

    return Promise.all([
      knexCount, !mapper ? knex : Promise.map(knex, (x) => mapper(x)),
    ]).then(([[{ dpncnt }], result]) => [dpncnt, result, page, rpp]);
  },
};

module.exports = db;
