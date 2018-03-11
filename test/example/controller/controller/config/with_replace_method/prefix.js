module.exports = {
  _get: '/with_prefix/:val1',
  get: (controller) => {
    return '/globally_replaced_to_root/with_prefix/' + controller.params('val1', true);
  }
};
