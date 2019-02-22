'use strict';

function DPError(msg, req) {
  if (msg instanceof Error) {
    this.stack = msg.stack;
    this.message = msg.message;
    this.code = msg.code;
    this.originalError = msg;
  } else {
    Error.captureStackTrace(this, this.constructor);

    this.message = msg;
  }

  this.req = req;
}
Object.defineProperty(DPError.prototype, 'name', {
  value: 'DPError',
  writable: false,
  enumerable: false,
  configurable: true,
});

module.exports = DPError;
