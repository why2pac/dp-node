const assert = require('assert');

module.exports = {
  get() {
    assert(this.model.data.foo.bar === 'bar');
    assert(this.model.data.foo.baz() === 'baz');
    assert(this.model.data.foo.boz() === 'boz');

    return 'done';
  },
};
