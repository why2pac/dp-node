'use strict';

module.exports = {
  __: (req, res, _next) => {
    res.status(200).send('file/child3/middleware');
  },
  get: (controller) => {
    controller.finish('file/child2/get');
  },
};
