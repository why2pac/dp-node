const assert = require('assert');

module.exports = {
  async get() {
    assert((await this.helper.foo.bar()) === (await this.helper.bar.barAsync()));
    assert((await this.helper.foo.baz()) === (await this.helper.bar.bazAsync()));
    assert((await this.helper.foo.bar()) === 'bar');
    assert((await this.helper.foo.baz()) === 'baz');

    return 'done';
  },
};
