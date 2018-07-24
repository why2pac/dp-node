module.exports = async (controller, error) => {
  controller.finishWithCode(401, 'Intended 401 Error')
};
