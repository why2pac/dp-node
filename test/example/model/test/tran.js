const assert = require('assert');

module.exports = {
  dropTable: (db) => {
    return db.execute('DROP TABLE IF EXISTS tran_test', stage);
  },
  succ: (db) => {
    var res = db.tran([
      () => {
        return [`
          CREATE TABLE IF NOT EXISTS tran_test (
            id INT(?) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            value VARCHAR(?) DEFAULT 'EMPTY'
          );`
        , [11, 32]];
      },
      (tr1) => {
        return [`
          INSERT INTO tran_test (value) VALUES (?)
        `, ['ABC']];
      },
      (tr1, tr2) => {
        assert(tr2.insertId === 1);

        return [`
          INSERT INTO tran_test (value) VALUES (?)
        `, ['123']];
      },
      (tr1, tr2, tr3) => {
        assert(tr3.insertId === 2);

        return [`
          INSERT INTO tran_test (value) VALUES (?)
        `, ['abc']];
      },
      (tr1, tr2, tr3, tr4) => {
        assert(tr4.insertId === 3);

        return [`SELECT value FROM tran_test ORDER BY id ASC`];
      },
      (tr1, tr2, tr3, tr4, tr5) => {
        return [`DROP TABLE tran_test`];
      }
    ], stage);

    return res;
  },
  fail: (db) => {
    var res = null;

    try {
      res = db.tran([
        () => {
          return [`
            CREATE TABLE IF NOT EXISTS tran_test (
              id INT(?) NOT NULL AUTO_INCREMENT PRIMARY KEY,
              value VARCHAR(?) DEFAULT 'EMPTY'
            );`
          , [11, 32]]
        },
        () => {
          return [`
            INSERT INTO tran_test (value, intended_exception) VALUES (?, ?)
          `, ['123', 'raise Exception']];
        },
        () => {
          return [`SELECT value FROM tran_test ORDER BY id ASC`];
        },
      ], stage);
    }
    catch (e) {
      return false;
    }

    return res;
  }
};
