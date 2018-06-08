const assert = require('assert');

global.mode = 'job';
require('../app')(async (dp) => {
  var create = await dp.model.test.createTable();
  var insert = await dp.model.test.insertRecord();
  var inserted = await dp.model.test.inquiryRecord();

  assert(insert.insertId);
  assert(inserted.id && inserted.value);

  console.log('done');
});
