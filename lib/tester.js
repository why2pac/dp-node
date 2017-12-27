module.exports = {
  init: function() {
    global.isTest = true;
  
    return (fn, dp) => {
      const request = require('supertest');
      const findPortSync = require('find-port-sync');
      const port = findPortSync();
    
      describe('WebServer', () => {
        var app = undefined;
        
        before(() => {
          app = dp.listen(port);
        });
    
        after(() => {
          app.close();
          app = undefined;
        });
    
        fn(() => {
          return request(app);
        });
      });
    }
  }
};