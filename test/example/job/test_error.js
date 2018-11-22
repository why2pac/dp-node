global.mode = 'job';
global.DP_NODE_JOB_UNCAUGHT_FATAL_EXCEPTION_CODE = 0;

require('../app')(() => {
  console.log(intended_exception); // eslint-disable-line
});
