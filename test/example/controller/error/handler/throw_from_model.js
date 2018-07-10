module.exports = {
  get: async (controller) => {
    return controller.model.test.error.throwFromMethod()
  }
}
