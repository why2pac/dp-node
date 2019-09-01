'use strict';

module.exports = {
  get: async (controller) => {
    const params = {
      foo: 'foo-helper',
    };

    await controller.render('view/helper_custom.html', params);
  },
};
