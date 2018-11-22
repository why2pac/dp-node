module.exports = (req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(200).send(`${res.testBegin}-${res.buffer.body}-${res.testController}`);
};
