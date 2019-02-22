'use strict';

module.exports = (req, res, _next) => {
  res.async((_dp) => {
    res.status(200).send('file/middleware');
  });
};
