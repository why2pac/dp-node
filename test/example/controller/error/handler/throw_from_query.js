module.exports = {
  get: async (controller) => {
    return await controller.model.test.error.throwFromQuery();
  }
}
