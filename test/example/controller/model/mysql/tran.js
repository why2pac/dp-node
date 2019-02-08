'use strict';

const assert = require('assert');

module.exports = {
  get: async (controller) => {
    const tableSuffix = String(Math.random()).slice(2);

    await controller.model.test.tran.dropTable(tableSuffix);

    const fail = await controller.model.test.tran.fail(tableSuffix);

    assert(!fail);

    const res = await controller.model.test.tran.succ(tableSuffix);

    assert(res[0].warningCount);
    assert(res[1].insertId === 1);
    assert(res[2].insertId === 2);
    assert(res[3].insertId === 3);
    assert(res[4].length === 3);
    assert(res[4][0].value === 'ABC');
    assert(res[4][1].value === '123');
    assert(res[4][2].value === 'abc');
    assert(!res[5].warningCount);

    return 'done';
  },
};
