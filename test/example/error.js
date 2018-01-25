module.exports = (controller, error, statusCode) => {
  // for async-await test
  controller.model.test.inquiryRecord();

  // from Job exception.
  if (error.name === 'DPJobError') {
    console.error('job exception');
    return;
  }

  if (statusCode === 404) {
    if (controller.params('view') === 'yes') {
      return controller.render('system/404.html');
    }
    else if (controller.params('redirect') === 'yes') {
      return controller.redirect('/');
    }

    return controller.finisher.notfound('404 NOTFOUND');
  }

  if (error && error.originalError &&
      error.originalError.name === 'CustomError' &&
      error.originalError.message) {
    return controller.finisher.error(error.originalError.message);
  }

  controller.finisher.error('[' + statusCode + '] An error has occurred.');
};
