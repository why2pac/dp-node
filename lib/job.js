const dpJobError = require('./misc/dp_job_error');

const getExitFunc = (exitCode) => {
  const k = typeof exitCode !== 'undefined' ? exitCode : 1;
  return _ => process.exit(k); // eslint-disable-line no-unused-vars
};

const succ = getExitFunc(0);

module.exports = (config) => {
  const asyncDp = {
    helper: config.helper,
    model: config.model,
    view: config.view,
  };

  const fail = (err) => {
    if (typeof config.handler.error === 'function') {
      const exit = getExitFunc(global.DP_NODE_JOB_UNCAUGHT_FATAL_EXCEPTION_CODE);
      const errObj = new dpJobError(err); // eslint-disable-line new-cap

      config.handler.error(asyncDp, errObj, null)
        .then(exit, (e) => {
          console.error(e); // eslint-disable-line no-console
          return exit(e);
        });
    }
  };

  return (delegate) => {
    // No need to test whether delegate is an AsyncFunction
    // since Promise joins (follows) them automatically
    new Promise(resolve => resolve(delegate(asyncDp))).then(succ, fail);
  };
};
