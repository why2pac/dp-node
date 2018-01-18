module.exports = (controller, error, statusCode) => {
  // from Job exception.
  if (!controller) {
    console.error('job exception');
    return;
  }

  if (statusCode === 404) {
    return controller.finisher.notfound('404 NOTFOUND');
  }

  controller.finisher.error('[' + statusCode + '] An error has occurred.');
};
