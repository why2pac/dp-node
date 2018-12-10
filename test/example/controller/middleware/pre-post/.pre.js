module.exports = {
  async get() {
    return this.model.data.foo.pre;
  }
}
