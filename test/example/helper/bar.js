module.exports = {
  async barAsync() {
    return new Promise((resolve) => {
      resolve(this.__.foo.bar()); // eslint-disable-line no-underscore-dangle
    });
  },
  bazAsync: async helper => helper.__.foo.baz(), // eslint-disable-line no-underscore-dangle
  boz() {
    return this.__.foo.boz; // eslint-disable-line no-underscore-dangle
  },
  qux() {
    return this.helper.foo.qux();
  },
  quux() {
    return this.helper.foo.quux;
  },
  meow: 'moo',
  moo() {
    return this.helper.bar.meow;
  },
};
