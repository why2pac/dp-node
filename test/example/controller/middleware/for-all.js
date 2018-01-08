module.exports = {
  middleware: (req, res, next) => {
    var token = req.get('DP-NODE-TOKEN');

    res.async((dp) => {
      if (!token) {
        if (!dp.model.middleware.token.validate(token)) {
          return res.status(400).send('INVALID-TOKEN');
        }
      }

      next();
    });
  },
  get: (controller) => {
    controller.finish('DONE');
  },
  post: (controller) => {
    controller.finish('DONE');
  }
}
