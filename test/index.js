const assert = require('assert');
const CliTest = require('command-line-test');

require('../index').Tester.init()((req) => {
  it('Index', (done) => {
    req().get('/').expect(200, done);
  });

  describe('Controller', () => {
    describe('Finisher', () => {
      describe('Codes', () => {
        it('Response should be `NOTFOUND` with 404 status code.', (done) => {
          req().get('/controller/finisher/by_code/notfound').expect(404, 'NOTFOUND', done);
        });

        it('Response should be `INVALID` with 400 status code.', (done) => {
          req().get('/controller/finisher/by_code/invalid').expect(400, 'INVALID', done);
        });

        it('Response should be `UNAUTHORIZED` with 401 status code.', (done) => {
          req().get('/controller/finisher/by_code/unauthorized').expect(401, 'UNAUTHORIZED', done);
        });

        it('Response should be `DENIED` with 403 status code.', (done) => {
          req().get('/controller/finisher/by_code/denied').expect(403, 'DENIED', done);
        });

        it('Response should be `ERROR` with 500 status code.', (done) => {
          req().get('/controller/finisher/by_code/error').expect(500, 'ERROR', done);
        });
      });

      describe('Request', () => {
        it('Response should be requested url.', (done) => {
          req().get('/controller/req/url').expect(200, `http://127.0.0.1:${global.DP_TEST_PORT}`, done);
        });

        it('Response should be requested uri.', (done) => {
          req().get('/controller/req/uri').expect(200, `http://127.0.0.1:${global.DP_TEST_PORT}/controller/req/uri`, done);
        });
      });

      describe('Redirect', () => {
        it('Response should be `Found` when 302 status code redirected specified location.', (done) => {
          req().get('/controller/finisher/redirect').expect(302, 'Found. Redirecting to /', done);
        });

        it('Response should be `Moved` with 301 status code when redirected specified location.', (done) => {
          req().get('/controller/finisher/redirect/with_code').expect(301, 'Moved Permanently. Redirecting to /', done);
        });

        it('Response should be `Moved` with 301 status code when redirected specified location.', (done) => {
          req().get('/controller/finisher/redirect/with_code2').expect(301, 'Moved Permanently. Redirecting to /', done);
        });
      });
    });

    describe('Middleware', () => {
      it('Response should be `IGNORED` when returned `false` from controller method.', (done) => {
        req().get('/middleware/file/end/ignore').expect(200, 'IGNORED', done);
      });

      describe('Controller', () => {
        it('Response should be `pre-body-post` when configured pre-post controller.', (done) => {
          req().get('/middleware/pre-post').expect(200, 'pre-body-post', done);
        });

        it('Response should be `pre-sub-post` when configured pre-post controller.', (done) => {
          req().get('/middleware/pre-post/child/sub').expect(200, 'pre-sub-post', done);
        });

        it('Response should be `r-pre-r-path-r-post` when configured pre-post controller.', (done) => {
          req().get('/middleware/pre-post/replace/path').expect(200, 'r-pre-r-path-r-post', done);
        });

        it('Response should be `Intended 401 Error` when not exists location.', (done) => {
          req().get('/middleware/pre-post/replace/not-found').expect(401, 'Intended 401 Error', done);
        });

        it('Response should be `f-pre-for-all-f-post` when configured pre-post controller.', (done) => {
          req().get('/middleware/pre-post/for-all').expect(200, 'f-pre-for-all-f-post', done);
        });

        it('Response should be `An intended exception.` when exception occurred.', (done) => {
          req().get('/middleware/pre-post/error').expect(500, 'An intended exception.', done);
        });

        it('Response should be `Not Found` when access not exists location.', (done) => {
          req().get('/middleware/pre-post/not-found').expect(404, 'Not Found', done);
        });
      });
    });

    describe('Config', () => {
      describe('Path.Prefix', () => {
        describe('Relatively', () => {
          it('Response should be `URL` when configured relative prefix path.', (done) => {
            const url = '/controller/config/this/prefix/will/be/added/to/all/child/paths';
            req().get(url).expect(200, url, done);
          });

          it('Response should be `URL` when configured relative prefix path for sub path.', (done) => {
            const url = '/controller/config/this/prefix/will/be/added/to/all/child/paths/child';
            req().get(url).expect(200, url, done);
          });

          it('Response should be `URL` when configured relative prefix path for child directory.', (done) => {
            const url = '/controller/config/this/prefix/will/be/added/to/all/child/paths/sub/child';
            req().get(url).expect(200, url, done);
          });
        });

        describe('Absolutely', () => {
          it('Response should be `URL` when configured absolute prefix path.', (done) => {
            const url = '/this/prefix/will/be/added/to/all/child/paths/as/root';
            req().get(url).expect(200, url, done);
          });

          it('Response should be `URL` when configured absolute prefix path for sub path.', (done) => {
            const url = '/this/prefix/will/be/added/to/all/child/paths/as/root/sub';
            req().get(url).expect(200, url, done);
          });

          it('Response should be `URL` when configured absolute prefix path for child directory.', (done) => {
            const url = '/this/prefix/will/be/added/to/all/child/paths/as/root/sub/child';
            req().get(url).expect(200, url, done);
          });

          it('Response should be `URL` when configured absolute prefix path with controller prefix.', (done) => {
            const url = '/globally_replaced_to_root/param_val';
            req().get(url).expect(200, url, done);
          });

          it('Response should be `URL` when configured absolute prefix path with controller prefix for sub path.', (done) => {
            const url = '/globally_replaced_to_root/with_prefix/param_val';
            req().get(url).expect(200, url, done);
          });

          it('Response should be `URL` when configured absolute prefix path with controller prefix with regex.', (done) => {
            req().get('/globally_replaced_with_regex/1234').expect(200, '1234', done);
          });

          it('Response should be `URL` when configured absolute prefix path with controller prefix for all methods.', (done) => {
            const url = '/globally_replaced_to_root_all/param_val';
            req().get(url).expect(200, url, done);
          });

          it('Response should be `URL` when configured absolute prefix path with conditioned controller prefix for all methods.', (done) => {
            const url = '/globally_replaced_to_root_all/cond/1';
            req().get(url).expect(200, url, done);
          });

          it('Response should be 404 when configured absolute prefix path with conditioned controller prefix for all methods.', (done) => {
            const url = '/globally_replaced_to_root_all/cond/a';
            req().get(url).expect(404, done);
          });
        });

        describe('Priority', () => {
          it('Response should be higher priority path configured by dp ini.', (done) => {
            req().get('/controller/priority/same-path').expect(200, 'foo', done);
          });

          it('Response should be higher priority path configured by controller.', (done) => {
            req().get('/prefix/controller/config/priority/priority/same-path').expect(200, 'foo', done);
          });
        });
      });

      describe('Bubbling', () => {
        it('Response should be `propagation` when not configured bubbling option.', (done) => {
          req().get('/prefix/born/bone').expect(200, 'propagation', done);
        });

        it('Response should be `propagatable` when not configured bubbling option.', (done) => {
          req().get('/prefix/will/smith').expect(200, 'propagatable', done);
        });

        it('Response should be `bubbling` when configured bubbling option.', (done) => {
          req().get('/prefix/will/smith/prefix/james/bond').expect(200, 'bubbling', done);
        });

        it('Response should be `child` when configured bubbling option.', (done) => {
          req().get('/prefix/will/smith/prefix/james/bond/prefix/jone/doe').expect(200, 'child', done);
        });
      });
    });

    describe('Session', () => {
      it('Simple session test.', function anonymous(done) {
        this.timeout(5000);
        req().get('/session').expect(200, 'done', done);
      });
    });

    describe('Cache', () => {
      it('Simple cache test.', function anonymous(done) {
        this.timeout(5000);
        req().get('/cache').expect(200, 'done', done);
      });
    });

    describe('Error Handling', () => {
      describe('Finisher', () => {
        it('Response should be `NOTFOUND` with 404 status code.', (done) => {
          req().get('/error/404').expect(404, 'NOTFOUND', done);
        });

        it('Response should be `FOUND` with 302 status code.', (done) => {
          req().get('/this_is_a_not_exists_page?redirect=yes').expect(302, 'Found. Redirecting to /', done);
        });

        it('Response should be `404, RENDERED BY VIEW`.', (done) => {
          req().get('/this_is_a_not_exists_page?view=yes').expect(200, '404, RENDERED BY VIEW', done);
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
      it('Simple query test.', function anonymous(done) {
        this.timeout(5000);
        req().get('/model/mysql/simple').expect(200, 'done', done);
      });

      it('Simple transaction test.', function anonymous(done) {
        this.timeout(5000);
        req().get('/model/mysql/tran').expect(200, 'done', done);
      });

      it('Grouping with prefix.', function anonymous(done) {
        this.timeout(5000);
        req().get('/model/mysql/group').expect(200, 'done', done);
      });
    });

    describe('Common', () => {
      it('Dot notation loader test.', function anonymous(done) {
        this.timeout(5000);
        req().get('/model/loader').expect(200, 'done', done);
      });

      it('Property test.', function anonymous(done) {
        this.timeout(5000);
        req().get('/model/prop').expect(200, 'done', done);
      });
    });
  });

  describe('Helper', () => {
    it('Simple helper test.', (done) => {
      req().get('/helper/simple').expect(200, 'done', done);
    });
    it('Helper delegate test.', (done) => {
      req().get('/helper/delegate').expect(200, 'done', done);
    });
  });

  describe('Error Handling', () => {
    it('Response should be `This is an intended exception.`.', (done) => {
      req().get('/error/handler/throw_from_model?err=yes').expect(500, 'This is an intended exception.', done);
    });

    it('Response should be error message from database.', (done) => {
      req().get('/error/handler/throw_from_query?err=yes').then((res) => {
        assert(res.text.indexOf('xxx') !== -1);
        done();
      });
    });
  });

  describe('View', () => {
    it('Simple view rendering test.', (done) => {
      req().get('/view/simple_render').expect(200, 'rendered', done);
    });

    it('include helper stub test', (done) => {
      req().get('/view/includes').expect(200, 'Hello, world!', done);
    });

    it('include helper stub test (unsuffixed)', (done) => {
      req().get('/view/includes_nosuffix').expect(200, 'Goodbye, world!', done);
    });

    it('date helper test', (done) => {
      req().get('/view/helper_date').expect(200, '20000101', done);
    });

    it('nl2br helper test', (done) => {
      req().get('/view/helper_nl2br').expect(200, 'foo<br>\nbar', done);
    });

    it('custom helper test', (done) => {
      req().get('/view/helper_custom').expect(200, 'custom-foo-helper', done);
    });
  });

  describe('Job', () => {
    it('Response should be `done` for simple job test.', function anonymous() {
      this.timeout(5000);

      const jobTest = new CliTest();
      return jobTest.exec('node test/example/job/test.js').then((res) => {
        assert(String(res.stdout) === 'done');
      });
    });

    it('Response should be `job exception` for intended exception.', function anonymous() {
      this.timeout(5000);

      return new CliTest().exec('node test/example/job/test_error.js').then((res) => {
        assert(String(res.stderr).indexOf('job exception') !== -1);
      });
    });

    it('Response should be `done` for async job test.', function anonymous() {
      this.timeout(5000);

      return new CliTest().exec('node test/example/job/async_job.js').then((res) => {
        assert(String(res.stdout) === 'done');
      });
    });

    it('Response should be `rendered` for rendering a view.', function anonymous() {
      this.timeout(5000);

      return new CliTest().exec('node test/example/job/render_view.js').then((res) => {
        assert(String(res.stdout) === 'rendered');
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
}, require('./example/app'));

describe('Crypto signer', () => {
  const Signer = require('../lib/signer');
  const algos = ['sha224', 'sha256', 'sha384', 'sha512', 'ripemd160'];
  const keys = [
    'Test signer secret key',
    'Test signer secret key but with a pretty long string for secret larger than a block',
    '\u2b1a\u4d3c\u6f5e\u8170\ua392\uc5b4\ue7d6\u09f8',
    Buffer.from('Raw buffer key'),
    Buffer.from('Raw buffer key that is actually an ASCII '
                + 'but with a very long key still larger than a usual block'),
    Buffer.from([
      0x1a, 0x2b, 0x3c, 0x4d, 0x5e, 0x6f, 0x70, 0x81,
      0x92, 0xa3, 0xb4, 0xc5, 0xd6, 0xe7, 0xf8, 0x09,
    ]),
  ];
  const prefixes = ['', 's:', '\uD8FD', '\uD800\uDC00', 'af;cX\0\xFF', '\uFFFF', 'Lorem ipsum'];
  function forEachSigners(f) {
    algos.forEach((a) => keys.forEach((k) => prefixes.forEach((p) => f(new Signer(a, k, p)))));
  }
  const epcDat = new Date(0);
  const pstDat = new Date(1234);
  const futTim = 8.64e15;
  const futDat = new Date(futTim);
  const testString = 'The*quick brown fox jumps over@the~lazy#dog';
  it('should refuse verifying outright invalid strings', () => {
    forEachSigners((sgr) => {
      assert(sgr.unsign('') === undefined);
      assert(sgr.unsign('key') === undefined);
      assert(sgr.unsign('', testString) === null);
      assert(sgr.unsign('key', testString) === null);
      assert(sgr.unsign('', testString, true) === testString);
      assert(sgr.unsign('key', testString, true) === testString);
    });
  });
  it('should verify strings without expiry date', () => {
    forEachSigners((sgr) => {
      assert(sgr.unsign('', sgr.sign('', testString)) === testString);
      assert(sgr.unsign('key', sgr.sign('key', testString)) === testString);
      assert(sgr.unsign('key=', sgr.sign('key=', testString)) === testString);
    });
  });
  it('should verify empty strings without expiry date', () => {
    forEachSigners((sgr) => {
      assert(sgr.unsign('', sgr.sign('', '')) === '');
      assert(sgr.unsign('key', sgr.sign('key', '')) === '');
      assert(sgr.unsign('key=', sgr.sign('key=', '')) === '');
    });
  });
  it('should verify strings with expiry date in the future', () => {
    forEachSigners((sgr) => {
      assert(sgr.unsign('', sgr.sign('', testString, futDat)) === testString);
      assert(sgr.unsign('key', sgr.sign('key', testString, futDat)) === testString);
      assert(sgr.unsign('key=', sgr.sign('key=', testString, futDat)) === testString);
      assert(sgr.unsign('', sgr.sign('', testString, futTim)) === testString);
      assert(sgr.unsign('key', sgr.sign('key', testString, futTim)) === testString);
      assert(sgr.unsign('key=', sgr.sign('key=', testString, futTim)) === testString);
    });
  });
  it('should verify strings with expiry date in the future', () => {
    forEachSigners((sgr) => {
      assert(sgr.unsign('', sgr.sign('', '', futDat)) === '');
      assert(sgr.unsign('key', sgr.sign('key', '', futDat)) === '');
      assert(sgr.unsign('key=', sgr.sign('key=', '', futDat)) === '');
      assert(sgr.unsign('', sgr.sign('', '', futTim)) === '');
      assert(sgr.unsign('key', sgr.sign('key', '', futTim)) === '');
      assert(sgr.unsign('key=', sgr.sign('key=', '', futTim)) === '');
    });
  });
  it('should not verify expired strings (epoch)', () => {
    forEachSigners((sgr) => {
      assert(sgr.unsign('', sgr.sign('', testString, epcDat)) === null);
      assert(sgr.unsign('key', sgr.sign('key', testString, epcDat)) === null);
      assert(sgr.unsign('key=', sgr.sign('key=', testString, epcDat)) === null);
      assert(sgr.unsign('', sgr.sign('', testString, 0)) === null);
      assert(sgr.unsign('key', sgr.sign('key', testString, 0)) === null);
      assert(sgr.unsign('key=', sgr.sign('key=', testString, 0)) === null);
    });
  });
  it('should not verify expired strings', () => {
    forEachSigners((sgr) => {
      assert(sgr.unsign('', sgr.sign('', testString, pstDat)) === null);
      assert(sgr.unsign('key', sgr.sign('key', testString, pstDat)) === null);
      assert(sgr.unsign('key=', sgr.sign('key=', testString, pstDat)) === null);
      assert(sgr.unsign('', sgr.sign('', testString, 1234)) === null);
      assert(sgr.unsign('key', sgr.sign('key', testString, 1234)) === null);
      assert(sgr.unsign('key=', sgr.sign('key=', testString, 1234)) === null);
    });
  });
  it('should pass along expired strings anyway on unsafe mode (epoch)', () => {
    forEachSigners((sgr) => {
      assert(sgr.unsign('', sgr.sign('', testString, epcDat), true) === testString);
      assert(sgr.unsign('key', sgr.sign('key', testString, epcDat), true) === testString);
      assert(sgr.unsign('key=', sgr.sign('key=', testString, epcDat), true) === testString);
      assert(sgr.unsign('', sgr.sign('', testString, 0), true) === testString);
      assert(sgr.unsign('key', sgr.sign('key', testString, 0), true) === testString);
      assert(sgr.unsign('key=', sgr.sign('key=', testString, 0), true) === testString);
      assert(sgr.unsign('', sgr.sign('', testString, pstDat), true) === testString);
    });
  });
  it('should pass along expired strings anyway on unsafe mode', () => {
    forEachSigners((sgr) => {
      assert(sgr.unsign('key', sgr.sign('key', testString, pstDat), true) === testString);
      assert(sgr.unsign('key=', sgr.sign('key=', testString, pstDat), true) === testString);
      assert(sgr.unsign('', sgr.sign('', testString, 1234), true) === testString);
      assert(sgr.unsign('key', sgr.sign('key', testString, 1234), true) === testString);
      assert(sgr.unsign('key=', sgr.sign('key=', testString, 1234), true) === testString);
    });
  });
});

require('../index').Tester.init({ isAppBind: false })((supertest) => {
  const req = () => supertest('https://duckduckgo.com');

  describe('External Host', () => {
    it('Is DuckDuckGo alive?', function anonymous(done) {
      this.timeout(5000);
      req().get('/').expect(200, done);
    });
  });
}, require('./example/app'), 'Supertest');
