function DPJobError(err) {
  if (err instanceof Error) {
    this.stack = err.stack;
    this.message = err.message;
    this.code = err.code;
    this.originalError = err;
  } else {
    Error.captureStackTrace(this, this.constructor);

    this.message = err;
  }
}
Object.defineProperty(DPJobError.prototype, 'name', {
  value: 'DPJobError',
  writable: false,
  enumerable: false,
  configurable: true,
});

module.exports = DPJobError;
