module.exports = {
  get_: '/:id(\\d+)?',
  get: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
  post_: '/:id(\\d+)?',
  post: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
  delete_: '/:id(\\d+)?',
  delete: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
  put_: '/:id(\\d+)?',
  put: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
};
