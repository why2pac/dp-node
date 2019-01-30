const assert = require('assert');

module.exports = {
  async get() {
    assert(this.helper.bar.qux() === 'qux');
    assert(this.helper.bar.quux() === 'quux');
    assert(this.helper.bar.moo() === 'moo');
    assert(this.helper.bar.james() === true);

    return 'done';
  },
};
