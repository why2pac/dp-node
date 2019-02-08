'use strict';

const assert = require('assert');

module.exports = {
  async get() {
    var create = await this.model.test.createTable() // eslint-disable-line
    const insert = await this.model.test.insertRecord();
    const inserted = await this.model.test.inquiryRecord();
    var created2 = await this.model.test.knex.createTable() // eslint-disable-line

    assert(insert.insertId);
    assert(inserted.id && inserted.value);

    await this.model.test.options.test();
    await this.model.test.knex.test();

    return 'done';
  },
};
