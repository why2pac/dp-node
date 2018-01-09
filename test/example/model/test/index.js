module.exports = {
  createTable: (db) => {
    return db.execute(`
      CREATE TABLE IF NOT EXISTS simple_test (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(32) DEFAULT 'EMPTY'
      );
    `, stage);
  },
  insertRecord: (db) => {
    return db.execute(`
      INSERT INTO simple_test
        (value) VALUES (?)
    `, ['test'], stage);
  },
  inquiryRecord: (db) => {
    return db.row(`
      SELECT
        *
      FROM
        simple_test
      WHERE
        id = 1
    `, stage);
  }
};