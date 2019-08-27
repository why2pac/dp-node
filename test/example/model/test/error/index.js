module.exports = {
  throwFromMethod: () => {
    throw Error('This is an intended exception.');
  },
  throwFromQuery: async (db) => {
    const res = await db.row('SELECT xxx', global.stage);
    return res;
  },
};
