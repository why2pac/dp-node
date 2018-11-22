module.exports = {
  get: () => {
    throw Error('/middleware/file/error');
  },
};
