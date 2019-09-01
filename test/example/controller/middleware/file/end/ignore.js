'use strict';

module.exports = {
  get: (controller) => {
    controller.finish('IGNORED');
    return true;
  },
};
