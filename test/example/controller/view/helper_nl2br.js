'use strict';

module.exports = {
  get: async (controller) => {
    const params = {
      foo: 'foo\nbar',
    };

    await controller.render('view/helper_nl2br.html', params);
  },
};
