module.exports = {
  get: (controller) => {
    controller.raw.res.testController = 'controller'; // eslint-disable-line no-param-reassign
    return 'ok';
  },
};
