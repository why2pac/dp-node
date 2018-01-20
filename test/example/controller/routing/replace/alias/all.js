module.exports = {
  _: '/it-is-a-replaced-path-for-all-methods-alias',
  get: (controller) => {
    var path = controller.req.uri().slice(controller.req.url().length);
    return path;
  },
  post: (controller) => {
    var path = controller.req.uri().slice(controller.req.url().length);
    return path;
  },
  delete: (controller) => {
    var path = controller.req.uri().slice(controller.req.url().length);
    return path;
  },
  put: (controller) => {
    var path = controller.req.uri().slice(controller.req.url().length);
    return path;
  }
}
