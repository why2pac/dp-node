module.exports = {
  throwFromMethod: (db) => {
    throw Error('This is an intended exception.')
  },
  throwFromQuery: async (db) => {
    return await (db.row(`
      SELECT xxx
    `, stage))
  }
}
