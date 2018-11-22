module.exports = {
  get_: '/:val1',
  get: controller => `/globally_replaced_to_root/${controller.params('val1', true)}`,
};
