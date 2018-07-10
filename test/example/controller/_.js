module.exports = (req, res, next) => {
  res.async((dp) => {
    next()
  })
}
