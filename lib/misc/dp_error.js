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

  const keys = [
    'method',
    'statusCode',
    'statusMessage',
    'url',
    'originalUrl',
    'baseUrl',
    'httpVersion',
    'headers',
    'params',
    'query',
    'cookies',
    '_remoteAddress',
    '_startTime',
  ];
  const request = req || {};

  this.req = {};

  keys.forEach((key) => {
    this.req[key] = request[key];
  });
}
Object.defineProperty(DPError.prototype, 'name', {
  value: 'DPError',
  writable: false,
  enumerable: false,
  configurable: true,
});

module.exports = DPError;
