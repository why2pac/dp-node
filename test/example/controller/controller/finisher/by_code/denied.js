'use strict';

module.exports = {
  get: (controller) => {
    controller.finisher.denied('DENIED');
  },
};
