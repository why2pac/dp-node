'use strict';

const assert = require('assert');

module.exports = {
  async doIt() {
    const key = 'sf';
    const val = `123-${Date.now()}`;

    assert(await this.cache.set(key, val));
    assert(await this.cache.get(key) === val);

    assert(this.helper.cache.foo() === 'fooC');
  },
  foo() {
    return 'fooC';
  },
};
