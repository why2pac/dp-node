'use strict';

module.exports = (req, res, next) => { // eslint-disable-line no-unused-vars
  res.async((dp) => { // eslint-disable-line no-unused-vars
    res.status(200).send('file/middleware');
  });
};
