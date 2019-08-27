module.exports = {
  key: 'testTravisOpt',
  client: 'mysql',
  connection: {
    database: 'dp_node',
    host: 'localhost',
    port: 3306,
    charset: 'utf8',
    user: 'travis',
    password: '',
  },
  pool: {
    min: 0,
    max: 3,
  },
  options: {
    bindObjectAsString: true,
  },
};
