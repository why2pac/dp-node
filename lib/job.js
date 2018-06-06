const dpJobError = require('./misc/dp_job_error');

module.exports = (config) => {
  var asyncDp = {
    helper: config.helper,
    model: config.model
  };

  return async (delegate) => {
    try {
      await (delegate(asyncDp));
      process.exit(0);
    }
    catch (e) {
      var exitCode = global.DP_NODE_JOB_UNCAUGHT_FATAL_EXCEPTION_CODE;

      if (exitCode === undefined) {
        exitCode = 1;
      }

      if (typeof(config.handler.error) === 'function') {
        try {
          await config.handler.error(asyncDp, new dpJobError(e), null);
        }
        catch (e) {
          console.error(e);
        }
      }
      else {
        console.error(e);
      }

      process.exit(exitCode);
    }
  };
};
