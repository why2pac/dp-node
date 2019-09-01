'use strict';

module.exports = (req, res, next) => {
  res.async((_dp) => {
    next();
  });
};
