module.exports = (config) => {
  var asyncDp = {
    helper: config.helper,
    model: config.model
  };

  return (delegate) => {
    return async (() => {
      try {
        await (delegate(asyncDp));
        process.exit(0);
      }
      catch (e) {
        console.error(e);

        if (typeof(config.handler.error) === 'function') {
          config.handler.error(null, e, null);
        }

        var exitCode = global.DP_NODE_JOB_UNCAUGHT_FATAL_EXCEPTION_CODE;

        if (exitCode === undefined) {
          exitCode = 1;
        }

        process.exit(exitCode);
      }
    })();
  };
};
