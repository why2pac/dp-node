'use strict';

module.exports = {
  getMiddlewares: [
    (req, res, next) => {
      const token = req.get('DP-NODE-TOKEN');

      res.async((dp) => {
        if (!dp.model.middleware.token.validate(token)) {
          res.status(400).send('INVALID-TOKEN');
          return;
        }

        next();
      });
    },
    (req, res, next) => {
      const token2 = req.get('DP-NODE-TOKEN2');

      res.async((dp) => {
        if (!dp.model.middleware.token.validate(token2)) {
          res.status(400).send('INVALID-TOKEN');
          return;
        }

        next();
      });
    },
  ],
  get: (controller) => {
    controller.finish('DONE');
  },
};
