module.exports = {
  validate: (model, token) => {
    return token && String(token).length === 10
  }
}
