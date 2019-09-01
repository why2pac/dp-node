'use strict';

module.exports = {
  get: async (controller) => {
    await controller.render('view/includes.html');
  },
};
