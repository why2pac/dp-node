module.exports = {
  get: async (controller) => {
    const res = await controller.model.test.error.throwFromQuery()
    return res
  }
}
