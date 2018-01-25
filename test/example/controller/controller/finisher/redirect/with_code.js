module.exports = {
  get: (controller) => {
    controller.redirect('/', 301);
  }
};
