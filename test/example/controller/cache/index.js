const assert = require('assert');

module.exports = {
  async get() {
    const key1 = 'cache-test-1';
    const key2 = 'cache-test-2';
    const key3 = 'cache-test-2';
    const val1 = `val-${Date.now()}-1`;
    const val2 = `val-${Date.now()}-2`;
    const val3 = `val-${Date.now()}-3`;

    assert(await this.cache(global.stage).set(key1, val1));
    assert(await this.cache(global.stage).set(key2, val2));
    assert(await this.cache(global.stage).get(key1, val1) === val1);
    assert(await this.cache('nine').get(key1) !== val1);
    assert(await this.cache('nine').set(key2, val2));
    assert(await this.cache('nine').get(key2) === val2);
    assert(await this.cache.set(key3, val3));
    assert(await this.cache.get(key3) === val3);

    assert(await this.cache('mem').set(key1, val1));
    assert(await this.cache('mem').get(key1) === val1);

    const ttl = 10;

    assert(await this.cache('mem').set(key2, val2, ttl));
    assert(await this.cache('mem').ttl(key2) === ttl);
    assert(await this.cache('mem').expire(key2, ttl * 2));
    assert(await this.cache('mem').ttl(key2) <= (ttl * 2));

    assert(await this.cache.set(key1, val1, 1));
    assert(await this.cache.get(key1) === val1);
    assert(await this.cache('mem').set(key1, val1, 1));
    assert(await this.cache('mem').get(key1) === val1);

    await this.model.test.sleep(2 * 1000);

    assert(await this.cache.get(key1) === null);
    assert(await this.cache('mem').get(key1) === null);

    await this.model.test.cache.doIt();
    await this.helper.cache.doIt();

    return 'done';
  },
};
