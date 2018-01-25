const assert = require('assert');

module.exports = {
  get: (controller) => {
    controller.model.test.tran.dropTable();

    var fail = controller.model.test.tran.fail();

    assert(!fail);

    var res = controller.model.test.tran.succ();

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
  }
};
