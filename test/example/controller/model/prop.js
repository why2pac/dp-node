'use strict';

const assert = require('assert');

module.exports = {
  get() {
    assert(this.model.data.foo.bar === 'bar');
    assert(this.model.data.foo.baz() === 'baz');
    assert(this.model.data.foo.boz() === 'boz');
    assert(this.model.test.underscoreCalc(1, 2) === this.model.test.underscore.calc(1, 2));
    assert(this.model.test.underscore.dblUnderscore(1, 2) === this.model.test.underscoreCalc(1, 2));
    assert(this.model.test.uscore.baz.boo().foz.zoo === 'zoo');
    assert(this.model.test.uscore.baz.koo() === 'koo');
    assert(this.model.test.uscore.foo.fao() === this.model.test.uscore.foo.far.fao);
    assert(this.model.test.uscore.one.inOne.two() === 'three');
    assert(this.model.test.uscore.qux.fao() === this.model.test.uscore.foo.far.fao);
    assert(this.model.test.uscore.qux.fred() === 'fred');
    assert(this.model.test.uscore.qux.koo() === 'koo');
    assert(this.model.test.uscore.qux.mos() === 'mos');

    return 'done';
  },
};
