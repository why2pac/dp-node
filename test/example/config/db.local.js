'use strict';

module.exports = {
  key: 'local',
  client: 'mysql',
  connection: {
    database: 'dp_node',
    host: 'localhost',
    port: 3306,
    charset: 'utf8',
    user: 'dp_node',
    password: 'dp_node',
  },
  pool: {
    min: 0,
    max: 3,
  },
};
