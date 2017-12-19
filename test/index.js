require('./tester')((req) => {
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
  });

  describe('/view', () => {
    it('GET /simple_render', (done) => {
      req().get('/view/simple_render').expect(200, 'rendered', done);
    });
  });
});
