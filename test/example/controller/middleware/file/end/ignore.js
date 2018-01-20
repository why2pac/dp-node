module.exports = {
  get: (controller) => {
    controller.finish('IGNORED');
    return false;
  }
}
