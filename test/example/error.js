module.exports = (controller, error, statusCode) => {
  if (statusCode === 404) {
    return controller.finisher.notfound('404 NOTFOUND');
  }

  controller.finisher.error('[' + statusCode + '] An error has occurred.');
};
