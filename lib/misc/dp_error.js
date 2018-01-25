var DPError = function DPError(msg, req) {
  if (msg instanceof Error) {
    this.code = msg.code;
    this.stack = msg.stack;
    this.message = msg.message;
    this.req = req;
    this.originalError = msg;

    return;
  }
  else {
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.message = msg;
    this.req = req;
  }
};

module.exports = DPError;
