module.exports = {
  async barAsync() {
    return new Promise((resolve) => {
      resolve(this.foo.bar());
    });
  },
  bazAsync: async helper => helper.foo.baz(),
  boz() {
    return this.foo.boz;
  },
};
