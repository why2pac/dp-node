'use strict';

module.exports = {
  getPath: '/it-is-a-replaced-path',
  get: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  postPath: '/it-is-a-replaced-path-for-post',
  post: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  deletePath: '/it-is-a-replaced-path-for-delete',
  delete: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  putPath: '/it-is-a-replaced-path-for-put',
  put: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
};
