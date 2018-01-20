require('../index').Tester.init()((req) => {
  it('Index', (done) => {
    req().get('/').expect(200, done);
  });

  describe('Controller', () => {
    describe('Error Handling', () => {
      describe('Finisher', () => {
        it('Response should be `NOTFOUND` with 404 status code.', (done) => {
          req().get('/error/404').expect(404, 'NOTFOUND', done);
        });

        it('Response should be `ERROR` with 500 status code.', (done) => {
          req().get('/error/500_code').expect(500, 'ERROR', done);
        });
      });
    });

    describe('Exception Handler', () => {
      it('Response should be designated code and body on `error.js`.', (done) => {
        req().get('/error/500_handler').expect(500, '[500] An error has occurred.', done);
      });
    });
  });

  describe('Model', () => {
    describe('MySQL', () => {
      it('Simple query test.', function (done) {
        this.timeout(5000);
        req().get('/model/mysql/simple').expect(200, 'done', done);
      });
    });
  });

  describe('View', () => {
    it('Simple view rendering test.', (done) => {
      req().get('/view/simple_render').expect(200, 'rendered', done);
    });
  });

  describe('Job', () => {
    const CliTest = require('command-line-test');
    const Assert = require('assert');

    it('Response should be `done` for simple job test.', function (done) {
      this.timeout(5000);

      const jobTest = new CliTest();
      jobTest.exec('node test/example/job/test.js').then(res => {
        Assert(String(res.stdout) === 'done');
        done();
      });
    });

    it('Response should be `job exception` for intended exception.', function (done) {
      this.timeout(5000);
      
      const jobTest = new CliTest();
      jobTest.exec('node test/example/job/test_error.js').then((res) => {
        Assert(String(res.stderr).indexOf('job exception') !== -1);
        done();
      });
    });
  });

  describe('/middleware', () => {
    it('GET / - with invalid token', (done) => {
      req().get('/middleware').expect(400, 'INVALID-TOKEN', done);
    });

    it('GET / - with valid token', (done) => {
      req().get('/middleware').set('DP-NODE-TOKEN', '1234567890').expect(200, 'DONE', done);
    });

    describe('/file', () => {
      it('GET /file/child/grandchild', (done) => {
        req().get('/middleware/file/child/grandchild').expect(200, 'file/child/grandchild/middleware', done);
      });

      it('GET /middleware/file/child/grandchild2', (done) => {
        req().get('/middleware/file/child/grandchild2').expect(200, 'file/middleware', done);
      });

      it('GET /middleware/file/child', (done) => {
        req().get('/middleware/file/child').expect(200, 'file/middleware', done);
      });

      it('GET /middleware/file/child3', (done) => {
        req().get('/middleware/file/child3').expect(200, 'file/child3/middleware', done);
      });

      it('GET /middleware/file/child2', (done) => {
        req().get('/middleware/file/child2').expect(200, 'file/middleware', done);
      });

      it('GET /middleware/file', (done) => {
        req().get('/middleware/file').expect(200, 'file/middleware', done);
      });

      describe('/end', () => {
        it('GET /middleware/file/end', (done) => {
          req().get('/middleware/file/end').expect(200, 'middleware-for-end-and-returned-value', done);
        });
      });

      it('GET /middleware/file/error', (done) => {
        req().get('/middleware/file/error').expect(500, '/middleware/file/error/middleware', done);
      });

      it('GET /middleware/file/error2', (done) => {
        req().get('/middleware/file/error2').expect(500, '/middleware/file/error2/middleware', done);
      });
    });

    it('GET /middleware/file/not_async', (done) => {
      req().get('/middleware/file/not_async').expect(200, 'begin-ok-controller', done);
    });

    describe('/for-all', () => {
      it('GET / - with invalid token', (done) => {
        req().get('/middleware/for-all').expect(400, 'INVALID-TOKEN', done);
      });

      it('GET / - with valid token', (done) => {
        req().get('/middleware/for-all').set('DP-NODE-TOKEN', '1234567890').expect(200, 'DONE', done);
      });

      it('POST / - with valid token', (done) => {
        req().post('/middleware/for-all').set('DP-NODE-TOKEN', '1234567890').expect(200, 'DONE', done);
      });
    });

    describe('/multiple', () => {
      it('GET /multiple - with invalid token', (done) => {
        req()
        .get('/middleware/multiple')
        .expect(400, 'INVALID-TOKEN', done);
      });

      it('GET /multiple - with invalid token', (done) => {
        req()
        .get('/middleware/multiple')
        .set('DP-NODE-TOKEN', '1234567890')
        .expect(400, 'INVALID-TOKEN', done);
      });

      it('GET /multiple - with valid token', (done) => {
        req()
        .get('/middleware/multiple')
        .set('DP-NODE-TOKEN', '1234567890')
        .set('DP-NODE-TOKEN2', '1234567890')
        .expect(200, 'DONE', done);
      });
    });
  });

  describe('/routing', () => {
    it('GET /', (done) => {
      req().get('/routing').expect(200, 'GET /routing', done);
    });

    it('PUT /', (done) => {
      req().put('/routing').expect(200, 'PUT /routing', done);
    });

    it('POST /', (done) => {
      req().post('/routing').expect(200, 'POST /routing', done);
    });

    it('DELETE /', (done) => {
      req().delete('/routing').expect(200, 'DELETE /routing', done);
    });

    describe('/replace', () => {
      it('GET /it-is-a-replaced-path', (done) => {
        req().get('/it-is-a-replaced-path').expect(200, '/it-is-a-replaced-path', done);
      });

      it('POST /it-is-a-replaced-path-for-post', (done) => {
        req().post('/it-is-a-replaced-path-for-post').expect(200, '/it-is-a-replaced-path-for-post', done);
      });

      it('DELETE /it-is-a-replaced-path-for-delete', (done) => {
        req().delete('/it-is-a-replaced-path-for-delete').expect(200, '/it-is-a-replaced-path-for-delete', done);
      });

      it('PUT /it-is-a-replaced-path-for-put', (done) => {
        req().put('/it-is-a-replaced-path-for-put').expect(200, '/it-is-a-replaced-path-for-put', done);
      });

      it('GET /it-is-a-replaced-path-for-all-methods', (done) => {
        req().get('/it-is-a-replaced-path-for-all-methods').expect(200, '/it-is-a-replaced-path-for-all-methods', done);
      });

      it('POST /it-is-a-replaced-path-for-all-methods', (done) => {
        req().post('/it-is-a-replaced-path-for-all-methods').expect(200, '/it-is-a-replaced-path-for-all-methods', done);
      });

      it('DELETE /it-is-a-replaced-path-for-all-methods', (done) => {
        req().delete('/it-is-a-replaced-path-for-all-methods').expect(200, '/it-is-a-replaced-path-for-all-methods', done);
      });

      it('PUT /it-is-a-replaced-path-for-all-methods', (done) => {
        req().put('/it-is-a-replaced-path-for-all-methods').expect(200, '/it-is-a-replaced-path-for-all-methods', done);
      });

      describe('/alias', () => {
        it('GET /it-is-a-replaced-path-alias', (done) => {
          req().get('/it-is-a-replaced-path-alias').expect(200, '/it-is-a-replaced-path-alias', done);
        });

        it('POST /it-is-a-replaced-path-for-post-alias', (done) => {
          req().post('/it-is-a-replaced-path-for-post-alias').expect(200, '/it-is-a-replaced-path-for-post-alias', done);
        });

        it('DELETE /it-is-a-replaced-path-for-delete-alias', (done) => {
          req().delete('/it-is-a-replaced-path-for-delete-alias').expect(200, '/it-is-a-replaced-path-for-delete-alias', done);
        });

        it('PUT /it-is-a-replaced-path-for-put-alias', (done) => {
          req().put('/it-is-a-replaced-path-for-put-alias').expect(200, '/it-is-a-replaced-path-for-put-alias', done);
        });

        it('GET /it-is-a-replaced-path-for-all-methods-alias', (done) => {
          req().get('/it-is-a-replaced-path-for-all-methods-alias').expect(200, '/it-is-a-replaced-path-for-all-methods-alias', done);
        });

        it('POST /it-is-a-replaced-path-for-all-methods-alias', (done) => {
          req().post('/it-is-a-replaced-path-for-all-methods-alias').expect(200, '/it-is-a-replaced-path-for-all-methods-alias', done);
        });

        it('DELETE /it-is-a-replaced-path-for-all-methods-alias', (done) => {
          req().delete('/it-is-a-replaced-path-for-all-methods-alias').expect(200, '/it-is-a-replaced-path-for-all-methods-alias', done);
        });

        it('PUT /it-is-a-replaced-path-for-all-methods-alias', (done) => {
          req().put('/it-is-a-replaced-path-for-all-methods-alias').expect(200, '/it-is-a-replaced-path-for-all-methods-alias', done);
        });
      });

      describe('/with_params', () => {
        it('GET /replaced-path-with-suffix/22', (done) => {
          req().get('/replaced-path-with-suffix/22').expect(200, '22', done);
        });

        it('GET /replaced-path-with-suffix/23', (done) => {
          req().get('/replaced-path-with-suffix/23').expect(200, '23', done);
        });

        it('POST /replaced-path-with-suffix/22', (done) => {
          req().post('/replaced-path-with-suffix/22').expect(200, '22', done);
        });

        it('PUT /replaced-path-with-suffix/22', (done) => {
          req().put('/replaced-path-with-suffix/22').expect(200, '22', done);
        });

        it('DELETE /replaced-path-with-suffix/22', (done) => {
          req().delete('/replaced-path-with-suffix/22').expect(200, '22', done);
        });

        describe('/alias', () => {
          it('GET /replaced-alias-path-with-suffix', (done) => {
            req().get('/replaced-alias-path-with-suffix').expect(200, 'EMPTY', done);
          });

          it('GET /replaced-alias-path-with-suffix/22', (done) => {
            req().get('/replaced-alias-path-with-suffix/22').expect(200, '22', done);
          });

          it('POST /replaced-alias-path-with-suffix/22', (done) => {
            req().post('/replaced-alias-path-with-suffix/22').expect(200, '22', done);
          });

          it('PUT /replaced-alias-path-with-suffix/22', (done) => {
            req().put('/replaced-alias-path-with-suffix/22').expect(200, '22', done);
          });

          it('DELETE /replaced-alias-path-with-suffix/22', (done) => {
            req().delete('/replaced-alias-path-with-suffix/22').expect(200, '22', done);
          });
        });
      });
    });

    it('GET /sub/path', (done) => {
      req().get('/routing/sub/path').expect(200, '/routing/sub/path', done);
    });

    it('GET /with_params', (done) => {
      req().get('/routing/with_params').expect(200, 'EMPTY', done);
    });

    it('GET /with_params/22', (done) => {
      req().get('/routing/with_params/22').expect(200, '22', done);
    });

    it('GET /with_params/23', (done) => {
      req().get('/routing/with_params/23').expect(200, '/routing/with_params/23', done);
    });

    it('POST /with_params/22', (done) => {
      req().post('/routing/with_params/22').expect(200, '22', done);
    });

    it('PUT /with_params/22', (done) => {
      req().put('/routing/with_params/22').expect(200, '22', done);
    });

    it('DELETE /with_params/22', (done) => {
      req().delete('/routing/with_params/22').expect(200, '22', done);
    });

    describe('/alias', () => {
      it('GET /with_params/alias', (done) => {
        req().get('/routing/with_params/alias').expect(200, 'EMPTY', done);
      });

      it('GET /with_params/alias/22', (done) => {
        req().get('/routing/with_params/alias/22').expect(200, '22', done);
      });

      it('POST /with_params/alias/22', (done) => {
        req().post('/routing/with_params/alias/22').expect(200, '22', done);
      });

      it('PUT /with_params/alias/22', (done) => {
        req().put('/routing/with_params/alias/22').expect(200, '22', done);
      });

      it('DELETE /with_params/alias/22', (done) => {
        req().delete('/routing/with_params/alias/22').expect(200, '22', done);
      });
    });
  });
}, require('./example/app.js'));
