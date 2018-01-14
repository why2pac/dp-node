module.exports = (config) => {
  var asyncDp = {
    helper: config.helper,
    model: config.model
  };

  return (delegate) => {
    return async (() => {
      try {
        await (delegate(asyncDp));
        process.exit(0);
      }
      catch (e) {
        console.error(e);
        process.exit(1);
      }
    })();
  };
};
