'use strict';

module.exports = (req, res, _next) => {
  res.status(200).send(`${res.testBegin}-${res.buffer.body}-${res.testController}`);
};
