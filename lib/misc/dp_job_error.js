var DPJobError = function DPJobError (err) {
  this.name = this.constructor.name

  if (err instanceof Error) {
    this.code = err.code
    this.stack = err.stack
    this.message = err.message
    this.originalError = err
  } else {
    Error.captureStackTrace(this, this.constructor)

    this.message = err
  }
}

module.exports = DPJobError
