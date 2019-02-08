'use strict';

module.exports = {
  get: async controller => controller.model.test.error.throwFromMethod(),
};
