'use strict';

module.exports = {
  calc(a, b) {
    return a + b;
  },
  dblUnderscore(a, b) {
    return this.__.underscoreCalc(a, b); // eslint-disable-line no-underscore-dangle
  },
};
