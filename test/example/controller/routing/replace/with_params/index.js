'use strict';

module.exports = {
  getPath: '/replaced-path-with-suffix',
  getSuffix: '/:id(\\d+)?',
  get: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
  postPath: '/replaced-path-with-suffix',
  postSuffix: '/:id(\\d+)?',
  post: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
  deletePath: '/replaced-path-with-suffix',
  deleteSuffix: '/:id(\\d+)?',
  delete: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
  putPath: '/replaced-path-with-suffix',
  putSuffix: '/:id(\\d+)?',
  put: (controller) => {
    const id = controller.params('id', true);
    controller.finish(String(id || 'EMPTY'));
  },
};
