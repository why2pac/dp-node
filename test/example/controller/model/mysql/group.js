module.exports = {
  get: async (controller) => {
    await controller.model.test.group.test();

    return 'done';
  },
};
