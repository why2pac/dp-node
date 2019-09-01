'use strict';

const assert = require('assert');

module.exports = {
  async get() {
    /* eslint-disable no-unused-vars */
    const create = await this.model.test.createTable();
    const insert = await this.model.test.insertRecord();
    const inserted = await this.model.test.inquiryRecord();
    const created2 = await this.model.test.knex.createTable();

    assert(insert.insertId);
    assert(inserted.id && inserted.value);

    await this.model.test.options.test();
    await this.model.test.knex.test();

    return 'done';
  },
};
