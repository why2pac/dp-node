'use strict';

module.exports = {
  __: (req, res, next) => { // eslint-disable-line no-unused-vars
    res.status(200).send('file/child3/middleware');
  },
  get: (controller) => {
    controller.finish('file/child2/get');
  },
};
