module.exports = {
  get: async (controller) => {
    await controller.render('view/simple_render.html');
  },
};
