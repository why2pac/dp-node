const assert = require('assert');

module.exports = {
  dropTable: (db, tableSuffix) => {
    return db.execute('DROP TABLE IF EXISTS tran_test', stage);
  },
  succ: (db, tableSuffix) => {
    var res = db.tran([
      () => {
        return [`
          CREATE TABLE IF NOT EXISTS tran_test_` + tableSuffix + ` (
            id INT(?) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            value VARCHAR(?) DEFAULT 'EMPTY'
          );`
        , [11, 32]];
      },
      (tr1) => {
        return [`
          INSERT INTO tran_test_` + tableSuffix + ` (value) VALUES (?)
        `, ['ABC']];
      },
      (tr1, tr2) => {
        assert(tr2.insertId === 1);

        return [`
          INSERT INTO tran_test_` + tableSuffix + ` (value) VALUES (?)
        `, ['123']];
      },
      (tr1, tr2, tr3) => {
        assert(tr3.insertId === 2);

        return [`
          INSERT INTO tran_test_` + tableSuffix + ` (value) VALUES (?)
        `, ['abc']];
      },
      (tr1, tr2, tr3, tr4) => {
        assert(tr4.insertId === 3);

        return [`SELECT value FROM tran_test_` + tableSuffix + ` ORDER BY id ASC`];
      },
      (tr1, tr2, tr3, tr4, tr5) => {
        return [`DROP TABLE tran_test_` + tableSuffix];
      }
    ], stage);

    return res;
  },
  fail: (db, tableSuffix) => {
    var res = null;

    try {
      res = db.tran([
        () => {
          return [`
            CREATE TABLE IF NOT EXISTS tran_test_` + tableSuffix + ` (
              id INT(?) NOT NULL AUTO_INCREMENT PRIMARY KEY,
              value VARCHAR(?) DEFAULT 'EMPTY'
            );`
          , [11, 32]]
        },
        () => {
          return [`
            INSERT INTO tran_test_` + tableSuffix + ` (value, intended_exception) VALUES (?, ?)
          `, ['123', 'raise Exception']];
        },
        () => {
          return [`SELECT value FROM tran_test_` + tableSuffix + ` ORDER BY id ASC`];
        },
      ], stage);
    }
    catch (e) {
      return false;
    }

    return res;
  }
};
