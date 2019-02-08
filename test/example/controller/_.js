'use strict';

module.exports = (req, res, next) => {
  res.async((dp) => { // eslint-disable-line no-unused-vars
    next();
  });
};
