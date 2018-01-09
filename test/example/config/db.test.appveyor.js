module.exports = {
  key: 'testAppveyor',
  client: 'mysql',
  connection: {
    database: 'dp_node',
    host: 'localhost',
    port: 3306,
    charset: 'utf8',
    user: 'root',
    password: 'Password12!'
  },
  pool: {
    min: 0,
    max: 3
  }
};
