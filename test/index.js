require('../index').Tester.init()((req) => {
  it('GET /', (done) => {
    req().get('/').expect(200, done);
  });

  describe('/error', () => {
    it('GET /404', (done) => {
      req().get('/error/404').expect(404, 'NOTFOUND', done);
    });

    it('GET /500_code', (done) => {
      req().get('/error/500_code').expect(500, 'ERROR', done);
    });

    it('GET /500_handler', (done) => {
      req().get('/error/500_handler').expect(500, '[500] An error has occurred.', done);
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

  describe('/model', () => {
    it('GET /model', (done) => {
      req().get('/model').expect(200, 'done', done);
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

  describe('/view', () => {
    it('GET /simple_render', (done) => {
      req().get('/view/simple_render').expect(200, 'rendered', done);
    });
  });
}, require('./example/app.js'));
