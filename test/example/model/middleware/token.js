module.exports = {
  validate: (model, token) => token && String(token).length === 10,
};
