module.exports = {
  underscoreCalc(a, b) {
    return this._.underscore.calc(a, b);
  },
  sleep: (db, time) => new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  }),
  createTable: db => db.execute(`
      CREATE TABLE IF NOT EXISTS simple_test (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(32) DEFAULT 'EMPTY'
      );
    `, global.stage),
  insertRecord: db => db.execute(`
      INSERT INTO simple_test
        (value) VALUES (?)
    `, ['test'], global.stage),
  inquiryRecord: db => db.row(`
      SELECT
        *
      FROM
        simple_test
      ORDER BY
        id ASC
      LIMIT 1
    `, global.stage),
  dummy: db => db.row('SELECT 1', global.stage),
};
