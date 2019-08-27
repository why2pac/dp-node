const util = require('util');

function CustomError(message) {
  Error.captureStackTrace(this, this.constructor);

  this.message = message;
}
util.inherits(CustomError, Error);

Object.defineProperty(CustomError.prototype, 'name', {
  value: 'CustomError',
  writable: true,
  enumerable: false,
  configurable: true,
});

module.exports = (_req, _res, _next) => {
  throw new CustomError('/middleware/file/error2/middleware');
};
