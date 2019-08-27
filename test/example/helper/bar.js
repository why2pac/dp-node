module.exports = {
  async barAsync() {
    return new Promise((resolve) => {
      resolve(this.__.foo.bar());
    });
  },
  bazAsync: async (helper) => helper.__.foo.baz(),
  boz() {
    return this.__.foo.boz;
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
  james: (helper) => helper.bar.meow === 'moo',
};
