'use strict';

const assert = require('assert');

global.mode = 'job';
require('../app')(async (dp) => {
  await dp.model.test.createTable();

  const insert = await dp.model.test.insertRecord();
  const inserted = await dp.model.test.inquiryRecord();

  assert(insert.insertId);
  assert(inserted.id && inserted.value);

  console.log('done');
});
