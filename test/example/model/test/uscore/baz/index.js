'use strict';

module.exports = {
  ret(a) {
    return a;
  },
  boo() {
    return this._;
  },
  koo() {
    return this.__.bar.koo;
  },
};
