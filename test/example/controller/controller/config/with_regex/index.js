module.exports = {
  get() {
    return this.params('id', true);
  },
};
