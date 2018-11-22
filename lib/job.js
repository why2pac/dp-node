const dpJobError = require('./misc/dp_job_error');

module.exports = (config) => {
  const asyncDp = {
    helper: config.helper,
    model: config.model,
    view: config.view,
  };

  const succ = () => {
    process.exit(0);
  };

  const fail = (err) => {
    let exitCode = global.DP_NODE_JOB_UNCAUGHT_FATAL_EXCEPTION_CODE;

    if (exitCode === undefined) {
      exitCode = 1;
    }

    if (typeof config.handler.error === 'function') {
      config.handler.error(asyncDp, new dpJobError(err), null).then(() => { // eslint-disable-line
        process.exit(exitCode);
      }).catch((e) => {
        console.error(e); // eslint-disable-line no-console
        process.exit(exitCode);
      });
    }
  };

  return (delegate) => {
    const promise = new Promise((resolve, reject) => {
      if (delegate.constructor && delegate.constructor.name === 'AsyncFunction') {
        delegate(asyncDp).then(resolve).catch(reject);
      } else {
        try {
          resolve(delegate(asyncDp));
        } catch (err) {
          reject(err);
        }
      }
    });

    promise.then((res) => {
      succ(res);
    }).catch((err) => {
      fail(err);
    });
  };
};
