'use strict';

const CustomError = function CustomError(message) {
  Error.captureStackTrace(this, this.constructor);

  this.name = this.constructor.name;
  this.message = message;
};

require('util').inherits(CustomError, Error);

module.exports = (req, res, next) => { // eslint-disable-line no-unused-vars
  res.async((dp) => { // eslint-disable-line no-unused-vars
    throw new CustomError('/middleware/file/error/middleware');
  });
};
