const dpJobError = require('./misc/dp_job_error');

const getExitFunc = (exitCode) => {
  const k = typeof exitCode !== 'undefined' ? exitCode : 1;
  return () => global.DP_NODE_JOB_PROCESS_EXIT !== false && process.exit(k);
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
    const errObj = new dpJobError(err);

    return handler.error(asyncDp, errObj, null)
      .then(exit, (e) => {
        console.error(e);
        return exit();
      });
  };

  return (delegate) => new Promise((resolve) => resolve(delegate(asyncDp))).then(succ, fail);
};
