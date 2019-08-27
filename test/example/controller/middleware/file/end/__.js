module.exports = (req, res, next) => {
  res.async((dp) => {
    dp.controller.finish(`middleware-for-end-and-${res.buffer.body}`);
    next();
  });
};
