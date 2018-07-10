module.exports = {
  get: (controller) => {
    controller.raw.res.testController = 'controller'
    return 'ok'
  }
}
