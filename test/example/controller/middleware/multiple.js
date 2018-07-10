module.exports = {
  getMiddlewares: [
    (req, res, next) => {
      var token = req.get('DP-NODE-TOKEN')

      res.async((dp) => {
        if (!dp.model.middleware.token.validate(token)) {
          return res.status(400).send('INVALID-TOKEN')
        }

        next()
      })
    },
    (req, res, next) => {
      var token2 = req.get('DP-NODE-TOKEN2')

      res.async((dp) => {
        if (!dp.model.middleware.token.validate(token2)) {
          return res.status(400).send('INVALID-TOKEN')
        }

        next()
      })
    }
  ],
  get: (controller) => {
    controller.finish('DONE')
  }
}
