module.exports = {
  get: (controller) => {
    controller.finish('GET /routing')
  },
  put: (controller) => {
    controller.finish('PUT /routing')
  },
  post: (controller) => {
    controller.finish('POST /routing')
  },
  delete: (controller) => {
    controller.finish('DELETE /routing')
  }
}
