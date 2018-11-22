const assert = require('assert');

module.exports = {
  get: async (controller) => {
    var create = await controller.model.test.createTable() // eslint-disable-line
    const insert = await controller.model.test.insertRecord();
    const inserted = await controller.model.test.inquiryRecord();
    var created2 = await controller.model.test.knex.createTable() // eslint-disable-line

    assert(insert.insertId);
    assert(inserted.id && inserted.value);

    await controller.model.test.options.test();
    await controller.model.test.knex.test();

    return 'done';
  },
};
