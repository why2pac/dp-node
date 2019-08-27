module.exports = {
  _: '/cond/:val1(\\d+)',
  get: (controller) => `/globally_replaced_to_root_all/cond/${controller.params('val1', true)}`,
};
