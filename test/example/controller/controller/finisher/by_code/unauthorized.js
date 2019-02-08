'use strict';

module.exports = {
  get: (controller) => {
    controller.finisher.unauthorized('UNAUTHORIZED');
  },
};
