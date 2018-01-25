module.exports = {
  get: (controller) => {
    controller.finish(controller.req.uri());
  }
}
