'use strict';

module.exports = {
  _: '/:val1',
  get: (controller) => `/globally_replaced_to_root_all/${controller.params('val1', true)}`,
};
