const DPError = function DPError(msg, req) {
  this.name = this.constructor.name;

  if (msg instanceof Error) {
    this.code = msg.code;
    this.stack = msg.stack;
    this.message = msg.message;
    this.req = req;
    this.originalError = msg;
  } else {
    Error.captureStackTrace(this, this.constructor);

    this.message = msg;
    this.req = req;
  }
};

module.exports = DPError;
