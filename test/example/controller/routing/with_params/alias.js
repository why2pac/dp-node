module.exports = {
  get_: '/:id(\\d+)?',
  get: (controller) => {
    var id = controller.params('id', true)
    controller.finish(String(id || 'EMPTY'))
  },
  post_: '/:id(\\d+)?',
  post: (controller) => {
    var id = controller.params('id', true)
    controller.finish(String(id || 'EMPTY'))
  },
  delete_: '/:id(\\d+)?',
  delete: (controller) => {
    var id = controller.params('id', true)
    controller.finish(String(id || 'EMPTY'))
  },
  put_: '/:id(\\d+)?',
  put: (controller) => {
    var id = controller.params('id', true)
    controller.finish(String(id || 'EMPTY'))
  }
}
