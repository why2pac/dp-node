const assert = require('assert');

module.exports = {
  get: async (controller) => {
    var create = await controller.model.test.createTable();
    var insert = await controller.model.test.insertRecord();
    var inserted = await controller.model.test.inquiryRecord();

    assert(insert.insertId);
    assert(inserted.id && inserted.value);

    return 'done';
  }
};
