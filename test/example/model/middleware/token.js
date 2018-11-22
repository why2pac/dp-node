module.exports = {
  validate(token) {
    return token && String(token).length === 10;
  },
};
