'use strict';

module.exports = {
  _: '/it-is-a-replaced-path-for-all-methods-alias',
  get: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    return path;
  },
  post: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    return path;
  },
  delete: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    return path;
  },
  put: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    return path;
  },
};
