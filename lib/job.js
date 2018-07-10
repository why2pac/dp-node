const dpJobError = require('./misc/dp_job_error')

module.exports = (config) => {
  var asyncDp = {
    helper: config.helper,
    model: config.model,
    view: config.view
  }

  const succ = () => {
    process.exit(0)
  }

  const fail = (err) => {
    var exitCode = global.DP_NODE_JOB_UNCAUGHT_FATAL_EXCEPTION_CODE

    if (exitCode === undefined) {
      exitCode = 1
    }

    if (typeof config.handler.error === 'function') {
      config.handler.error(asyncDp, new dpJobError(err), null).then(() => {
        process.exit(exitCode)
      }).catch((e) => {
        console.error(e)
        process.exit(exitCode)
      })
    }
  }

  return (delegate) => {
    const promise = new Promise((resolve, reject) => {
      if (delegate.constructor && delegate.constructor.name === 'AsyncFunction') {
        delegate(asyncDp).then(resolve).catch(reject)
      } else {
        try {
          resolve(delegate(asyncDp))
        } catch (err) {
          reject(err)
        }
      }
    })

    promise.then((res) => {
      succ()
    }).catch((err) => {
      fail(err)
    })
  }
}
