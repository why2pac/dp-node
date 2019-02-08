'use strict';

module.exports = {
  fao() {
    return this.__.foo.fao(); // eslint-disable-line no-underscore-dangle
  },
  fred() {
    this._.quux.bark();
    this.__.foo.fao(); // eslint-disable-line no-underscore-dangle
    this.__.baz.koo(); // eslint-disable-line no-underscore-dangle
    return this._.quux.fred;
  },
  koo() {
    return this.__.baz.koo(); // eslint-disable-line no-underscore-dangle
  },
  mos() {
    this.model.test.uscore.qux.fred(); // eslint-disable-line no-underscore-dangle
    return this.__.qux.quux.mos; // eslint-disable-line no-underscore-dangle
  },
};
