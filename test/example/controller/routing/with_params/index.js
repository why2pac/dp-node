module.exports = {
  get_: '/:id(\\d+)?',
  get: (controller) => {
    var id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  }
};
