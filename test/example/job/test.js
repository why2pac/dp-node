'use strict';

global.mode = 'job';
require('../app')(() => {
  console.log('done');
});
