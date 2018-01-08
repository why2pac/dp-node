module.exports = {
  _: '/it-is-a-replaced-path-for-all-methods-alias',
  get: (controller) => {
    var path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  post: (controller) => {
    var path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  delete: (controller) => {
    var path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  put: (controller) => {
    var path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  }
}
