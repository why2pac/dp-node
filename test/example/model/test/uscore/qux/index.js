'use strict';

module.exports = {
  fao() {
    return this.__.foo.fao();
  },
  fred() {
    this._.quux.bark();
    this.__.foo.fao();
    this.__.baz.koo();
    return this._.quux.fred;
  },
  koo() {
    return this.__.baz.koo();
  },
  mos() {
    this.model.test.uscore.qux.fred();
    return this.__.qux.quux.mos;
  },
};
