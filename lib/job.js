'use strict';

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
    const { handler } = config;
    if (typeof handler.error !== 'function') return null;

    const exit = getExitFunc(global.DP_NODE_JOB_UNCAUGHT_FATAL_EXCEPTION_CODE);
    const errObj = new dpJobError(err); // eslint-disable-line new-cap

    return handler.error(asyncDp, errObj, null)
      .then(exit, (e) => {
        console.error(e); // eslint-disable-line no-console
        return exit(e);
      });
  };

  // No need to test whether delegate is an AsyncFunction
  // since Promise joins (follows) them automatically
  return delegate => new Promise(resolve => resolve(delegate(asyncDp))).then(succ, fail);
};
