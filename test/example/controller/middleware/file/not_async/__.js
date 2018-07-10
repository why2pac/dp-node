module.exports = (req, res, next) => {
  res.status(200).send(res.testBegin + '-' + res.buffer.body + '-' + res.testController)
}
