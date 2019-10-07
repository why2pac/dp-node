'use strict';

module.exports = {
  path: '/priority/same-path',
  priority: 200,
  get() {
    return 'foo';
  },
};
