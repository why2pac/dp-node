global.mode = 'job';
global.DP_NODE_JOB_UNCAUGHT_FATAL_EXCEPTION_CODE = 0;

require('../app')(async (dp) => {
  console.log(await dp.view.render('view/simple_render.html'));
});
