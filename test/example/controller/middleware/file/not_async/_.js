module.exports = (req, res, next) => {
  res.testBegin = 'begin';

  next();
};
