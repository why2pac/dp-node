const assert = require('assert');

module.exports = {
  get() {
    assert(this.model.data.foo.bar === 'bar');
    assert(this.model.data.foo.baz() === 'baz');
    assert(this.model.data.foo.boz() === 'boz');
    assert(this.model.test.underscoreCalc(1, 2) === this.model.test.underscore.calc(1, 2));
    assert(this.model.test.underscore.dblUnderscore(1, 2) === this.model.test.underscoreCalc(1, 2));

    return 'done';
  },
};
