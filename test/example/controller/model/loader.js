const assert = require('assert');

module.exports = {
  get: (controller) => {
    const prefix = controller.model.loader;

    assert(prefix.foo.foo_camel.foo.test() === 'model.loader.foo.fooCamel.foo.test');
    assert(prefix.foo.fooCamel.foo.test() === 'model.loader.foo.fooCamel.foo.test');
    assert(prefix.foo.fooCamel.with_index.test() === 'model.loader.foo.fooCamel.withIndex.test');
    assert(prefix.foo.fooCamel.withIndex.test() === 'model.loader.foo.fooCamel.withIndex.test');
    assert(prefix.foo.foo_camel.with_index.test() === 'model.loader.foo.fooCamel.withIndex.test');
    assert(prefix.foo.foo_camel.withIndex.test() === 'model.loader.foo.fooCamel.withIndex.test');

    assert(prefix.foo.foz_camel.foo.test() === 'model.loader.foo.fozCamel.foo.test');
    assert(prefix.foo.fozCamel.foo.test() === 'model.loader.foo.fozCamel.foo.test');
    assert(prefix.foo.fozCamel.with_index.test() === 'model.loader.foo.fozCamel.withIndex.test');
    assert(prefix.foo.fozCamel.withIndex.test() === 'model.loader.foo.fozCamel.withIndex.test');
    assert(prefix.foo.foz_camel.with_index.test() === 'model.loader.foo.fozCamel.withIndex.test');
    assert(prefix.foo.foz_camel.withIndex.test() === 'model.loader.foo.fozCamel.withIndex.test');

    assert(prefix.bar.bar_camel.foo.test() === 'model.loader.bar.barCamel.foo.test');
    assert(prefix.bar.barCamel.foo.test() === 'model.loader.bar.barCamel.foo.test');
    assert(prefix.bar.barCamel.without_index.test() === 'model.loader.bar.barCamel.withoutIndex.test');
    assert(prefix.bar.barCamel.withoutIndex.test() === 'model.loader.bar.barCamel.withoutIndex.test');
    assert(prefix.bar.bar_camel.without_index.test() === 'model.loader.bar.barCamel.withoutIndex.test');
    assert(prefix.bar.bar_camel.withoutIndex.test() === 'model.loader.bar.barCamel.withoutIndex.test');

    assert(prefix.bar.baz_camel.foo.test() === 'model.loader.bar.bazCamel.foo.test');
    assert(prefix.bar.bazCamel.foo.test() === 'model.loader.bar.bazCamel.foo.test');
    assert(prefix.bar.bazCamel.without_index.test() === 'model.loader.bar.bazCamel.withoutIndex.test');
    assert(prefix.bar.bazCamel.withoutIndex.test() === 'model.loader.bar.bazCamel.withoutIndex.test');
    assert(prefix.bar.baz_camel.without_index.test() === 'model.loader.bar.bazCamel.withoutIndex.test');
    assert(prefix.bar.baz_camel.withoutIndex.test() === 'model.loader.bar.bazCamel.withoutIndex.test');

    return 'done';
  }
};
