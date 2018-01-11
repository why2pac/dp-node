module.exports = {
  db: (db) => {
    if (db.engine._conn) {
      Object.keys(db.engine._conn).forEach((key) => {
        db.engine._conn[key].destroy();
      });
    }
  }
};
