module.exports = {
  get: async (controller) => {
    await controller.render('view/includes_nosuffix.html');
  },
};
