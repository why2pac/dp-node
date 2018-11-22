module.exports = {
  getSuffix: '/:id(\\d+)?',
  get: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
  postSuffix: '/:id(\\d+)?',
  post: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
  deleteSuffix: '/:id(\\d+)?',
  delete: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
  putSuffix: '/:id(\\d+)?',
  put: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
};
