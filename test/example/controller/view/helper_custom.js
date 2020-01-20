module.exports = {
  get: async (controller) => {
    const params = {
      foo: 'foo-helper',
    };

    return controller.model.test.view.helperCustom(params);
  },
};
