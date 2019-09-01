'use strict';

module.exports = {
  get: () => {
    throw Error('An intended exception.');
  },
};
