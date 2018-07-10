module.exports = {
  get: (controller) => {
    throw Error('/middleware/file/error')
  }
}
