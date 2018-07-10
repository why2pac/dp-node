module.exports = {
  getSuffix: '/:id(\\d+)?',
  get: (controller) => {
    var id = controller.params('id', true)
    controller.finish(String(id || 'EMPTY'))
  },
  postSuffix: '/:id(\\d+)?',
  post: (controller) => {
    var id = controller.params('id', true)
    controller.finish(String(id || 'EMPTY'))
  },
  deleteSuffix: '/:id(\\d+)?',
  delete: (controller) => {
    var id = controller.params('id', true)
    controller.finish(String(id || 'EMPTY'))
  },
  putSuffix: '/:id(\\d+)?',
  put: (controller) => {
    var id = controller.params('id', true)
    controller.finish(String(id || 'EMPTY'))
  }
}
