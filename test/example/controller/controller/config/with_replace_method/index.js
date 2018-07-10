module.exports = {
  get_: '/:val1',
  get: (controller) => {
    return '/globally_replaced_to_root/' + controller.params('val1', true)
  }
}
