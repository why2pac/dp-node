'use strict';

module.exports = {
  _get: '/with_prefix/:val1',
  get: (controller) => `/globally_replaced_to_root/with_prefix/${controller.params('val1', true)}`,
};
