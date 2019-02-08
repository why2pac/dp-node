'use strict';

module.exports = {
  async get() {
    await this.model.test.group.test();

    return 'done';
  },
};
