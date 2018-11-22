const assert = require('assert');

module.exports = async (controller, error, statusCode) => {
  // for async-await test
  const res = await controller.model.test.dummy();

  assert(res && res['1'] === 1);

  // from Job exception.
  if (error.name === 'DPJobError') {
    console.error('job exception'); // eslint-disable-line no-console
    return;
  }

  if (statusCode === 404) {
    if (controller.params('view') === 'yes') {
      controller.render('system/404.html');
      return;
    } if (controller.params('redirect') === 'yes') {
      controller.redirect('/');
      return;
    }

    controller.finisher.notfound('404 NOTFOUND');
    return;
  }

  if (error && error.originalError
      && error.originalError.name === 'CustomError'
      && error.originalError.message) {
    controller.finisher.error(error.originalError.message);
    return;
  }

  if (controller.params('err') === 'yes') {
    controller.finisher.error(error.message || 'An error has occurred.');
    return;
  }

  controller.finisher.error(`[${statusCode}] An error has occurred.`);
};
