'use strict';

module.exports = {
  middleware: (req, res, next) => {
    const token = req.get('DP-NODE-TOKEN');

    res.async((dp) => {
      if (!dp.model.middleware.token.validate(token)) {
        res.status(400).send('INVALID-TOKEN');
        return;
      }

      next();
    });
  },
  get: (controller) => {
    controller.finish('DONE');
  },
  post: (controller) => {
    controller.finish('DONE');
  },
};
