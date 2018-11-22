module.exports = {
  path: '/it-is-a-replaced-path-for-all-methods',
  get: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  post: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  delete: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  put: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
};
