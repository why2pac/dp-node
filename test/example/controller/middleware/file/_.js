module.exports = (req, res, next) => {
  res.async((dp) => {
    res.status(200).send('file/middleware');
  });
};
