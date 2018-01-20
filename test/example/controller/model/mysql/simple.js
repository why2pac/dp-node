const assert = require('assert');

module.exports = {
  get: (controller) => {
    var create = controller.model.test.createTable();
    var insert = controller.model.test.insertRecord();
    var inserted = controller.model.test.inquiryRecord();

    assert(insert.insertId);
    assert(inserted.id && inserted.value);

    return 'done';
  }
};
