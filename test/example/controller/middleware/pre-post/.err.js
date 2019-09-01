'use strict';

module.exports = async (controller, error) => {
  return `${error.message}`;
};
