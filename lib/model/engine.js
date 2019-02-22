'use strict';

const Promise = require('bluebird');
const knexQb = require('knex/lib/query/builder');
const knexRaw = require('knex/lib/raw');

// Override

// Override - select
const AS_RE = /\bas\s*[\s`'"]/i;
const knexSelect = knexQb.prototype.select;
knexQb.prototype.select = function select(field, prefix) {
  if (typeof field === 'object' && prefix) {
    if (!this.selectGroups) {
      this.selectGroups = [];
    }
    this.selectGroups.push(prefix);
    const replacement = `$&${prefix.replace('$', '$$$$')}_`;
    field = field.map(e => e.replace(AS_RE, replacement)); // eslint-disable-line no-param-reassign
  }

  return knexSelect.call(this, field);
};

const knexInsert = knexQb.prototype.insert;
const knexUpdate = knexQb.prototype.update;

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
    return data.map(e => prepareParams(config, e));
  } if (typeof data === 'object') {
    Object.keys(data).forEach((key) => {
      if (data[key] && typeof data[key] === 'object') {
        data[key] = prepareParam(data[key]); // eslint-disable-line no-param-reassign
      }
    });
  }

  return data;
};

// Override - insert
knexQb.prototype.insert = function insert(data, returning) {
  return knexInsert.call(this, prepareParams(this.client.config, data), returning);
};

// Override - update
knexQb.prototype.update = function update(a, b, c) {
  return knexUpdate.call(this, prepareParams(this.client.config, a), b, c);
};

const overridableKnexMethods = [
  'where',
  'orWhere',
  'andWhere',
  'whereIn',
  'orWhereIn',
  'whereNotIn',
  'orWhereNotIn',
];

const prepareParamsForMixed = (args) => {
  const first = args[0];
  const second = args[1];

  if (args.length === 1 && first && typeof first === 'object' && !(first instanceof knexRaw)) {
    // type of ({key: 'val'})
    args[0] = prepareParams(this.client.config, args[0]); // eslint-disable-line no-param-reassign
  } else if (args.length === 2 && typeof first === 'string' && Array.isArray(second)) {
    // type of (key, ['val'])
    args[1] = args[1].map(e => prepareParam(e)); // eslint-disable-line no-param-reassign
  } else if (args.length === 2 && typeof first === 'string' && typeof second === 'object') {
    // type of (key, 'val')
    args[1] = prepareParam(args[1]); // eslint-disable-line no-param-reassign
  } else if (args.length === 2 && Array.isArray(first) && Array.isArray(second)) {
    // type of ([key1, key2], ['val1', 'val2'])
    args[1] = second.map(e => prepareParam(e)); // eslint-disable-line no-param-reassign
  }
};

const { getPrototypeOf } = Object;
const fnApply = Function.prototype.call.bind(Function.prototype.apply);
overridableKnexMethods.forEach((method) => {
  /* eslint-disable prefer-rest-params */
  function override() {
    if ((this.client.config.options || {}).bindObjectAsString) {
      prepareParamsForMixed(arguments);
    }

    return fnApply(getPrototypeOf(override), this, arguments);
  }
  /* eslint-enable prefer-rest-params */
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
    if (dsns) {
      dsns.forEach((dsn) => {
        db.conn(dsn);
      });
    }
  },
  _conn: {},
  conn: (dsn) => {
    let key;

    if (typeof dsn === 'string') {
      key = dsn;
    } else if (dsn.key) {
      ({ key } = dsn);
    } else {
      key = `${dsn.client}|${dsn.connection.database}|${dsn.connection.host}|${dsn.connection.user}`;
    }

    if (db._conn[key]) {
      return db._conn[key];
    }

    db._conn[key] = require('knex')(dsn);

    return db._conn[key];
  },
  knex: dsn => db.conn(dsn),
  tran: (blocks, dsn) => {
    const results = [];

    return db
      .conn(dsn)
      .transaction(tran => Promise.each(blocks, (block) => {
        const payload = block.apply(this, results);

        if (payload) {
          return tran.raw(payload[0], payload[1]).then((result) => {
            results.push(result[0]);
          });
        }

        return null;
      }))
      .then(_ => results);
  },
  execute: (query, params, dsn) => {
    if (typeof dsn === 'undefined' && params) {
      dsn = params; // eslint-disable-line no-param-reassign
      params = undefined; // eslint-disable-line no-param-reassign
    }

    return db.conn(dsn).raw(query, params).then(r => (r[0] ? r[0] : {}));
  },
  rows: (query, params, dsn) => db.execute(query, params, dsn),
  row: (query, params, dsn) => (
    db.rows(query, params, dsn).then(r => (r && r.length >= 1 ? r[0] : null))),
  grouping: (prefixes, row) => {
    if (typeof row !== 'undefined') {
      if (Array.isArray(row)) {
        return row.map(e => db.grouping(prefixes, e));
      }
      const obj = {};

      Object.keys(row).forEach((e) => {
        // eslint-disable-next-line no-param-reassign
        prefixes = typeof prefixes === 'string' ? [prefixes] : prefixes;

        let prefix = prefixes.filter(p => e.startsWith(`${p}_`));

        if (prefix.length > 0) {
          ([prefix] = prefix);
          obj[prefix] = obj[prefix] || {};
          obj[prefix][e.substr(prefix.length + 1)] = row[e];
        } else {
          obj[e] = row[e];
        }
      });

      return obj;
    }
    return function grouping(e) {
      return db.grouping(prefixes, e);
    };
  },
  paginate: (knex, page, rpp, mapper) => {
    if (typeof mapper !== 'undefined' && typeof mapper !== 'function') {
      throw new TypeError('optional argument (mapper) must be a function');
    }
    page = parseInt(page, 10) || 1; // eslint-disable-line no-param-reassign
    rpp = parseInt(rpp, 10) || 20; // eslint-disable-line no-param-reassign

    const select = knex._statements
      .reduce((a, e) => (e.grouping === 'columns' ? e.value.concat(a) : a), []);

    const knexCount = knex.clone().clearSelect().count('* AS cnt');

    knex.clearSelect().select(select);
    knex.limit(rpp).offset((page - 1) * rpp);

    return Promise.all([
      knexCount, !mapper ? knex : Promise.map(knex, x => mapper(x)),
    ]).then(([[{ cnt }], result]) => [cnt, result, page, rpp]);
  },
};

module.exports = db;
