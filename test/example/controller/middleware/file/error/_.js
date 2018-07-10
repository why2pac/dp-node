var CustomError = function CustomError (message) {
  Error.captureStackTrace(this, this.constructor)

  this.name = this.constructor.name
  this.message = message
}

require('util').inherits(CustomError, Error)

module.exports = (req, res, next) => {
  res.async((dp) => {
    throw new CustomError('/middleware/file/error/middleware')
  })
}
