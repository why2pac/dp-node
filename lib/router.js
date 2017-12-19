const bodyParser = require('body-parser');
const controller = require('./controller');

module.exports = (config) => {
  var session = require('./controller/library/session')(config);
  var cookie = require('./controller/library/cookie')(config);

  var bodyParserUrlEncodedOpts = {extended: true};

  if (config.cfg.requestSizeLimit != undefined) {
    bodyParserUrlEncodedOpts.limit = config.cfg.requestSizeLimit;
  }

  var bodyParserUrlEncoded = bodyParser.urlencoded(bodyParserUrlEncodedOpts);

  var handler = (delegate, req, res) => {
    return async (() => {
      var ctrl = controller.delegate(config, req, res, session, cookie);

      try {
        await (delegate(ctrl))
      }
      catch (err) {
        controller.handler.serverError(ctrl, req, res, config, err, 500);
      }
    })()
  }

  var delegates = {
    route: (method, path, delegate, middlewares) => {
      var params = [path];
      var fn = undefined;

      if (method == 'get') {
        fn = config.app.get;
      }
      else if (method == 'post') {
        fn = config.app.post;
        params.push(bodyParserUrlEncoded);
      }
      else if (method == 'delete') {
        fn = config.app.delete;
        params.push(bodyParserUrlEncoded);
      }
      else if (method == 'put') {
        fn = config.app.put;
        params.push(bodyParserUrlEncoded);
      }

      // Add middlewares
      if (middlewares && typeof(middlewares) === 'object') {
        params.push((req, res, next) => {
          var dp = (callback) => {
            return async(() => {
              var ctrl = controller.delegate(config, req, res, session, cookie);
              var handler = {
                controller: ctrl,
                helper: config.helper,
                model: config.model
              };

              try {
                await (callback(handler))
              }
              catch (err) {
                controller.handler.serverError(ctrl, req, res, config, err, 500);
              }
            })();
          };

          req.async = dp;
          res.async = dp;

          next();
        });

        middlewares.forEach((middleware) => {
          params.push(middleware);
        });
      }

      // Add action
      params.push((req, res, next) => {
        handler(delegate, req, res, next)
      });

      if (fn) {
        fn.apply(config.app, params);
      }
    }
  }

  if (config.cfg.controller) {
    var fs = require('fs');
    var trees = [];

    var traverse = (path, dirPath) => {
      try {
        if (!fs.statSync(dirPath).isDirectory()) {
          return;
        }
      } catch(_) {
        console.error('Controller path load error, ' + dirPath);
        return;
      }

      fs.readdirSync(dirPath).forEach(function(name) {
        var fullPath = dirPath + '/' + name

        if (name.startsWith('.')) { return }

        if (fs.statSync(fullPath).isDirectory()) {
          traverse(path + '/' + name, fullPath)
        }
        else {
          includePreapre(
            name != 'index.js' ? path + '/' + name.substr(0, name.lastIndexOf('.')) : path,
            fullPath
          );
        }
      })
    }

    var includePreapre = (path, filePath) => {
      if (!fs.statSync(filePath).isFile()) { return false }

      var routes = require(filePath)
      var methods = ['get', 'post', 'delete', 'put']

      methods.forEach((method) => {
        if (typeof routes[method] == 'function') {
          var replaceAll = routes.path;
          var replaceMethod = routes['_' + method];
          var suffix = routes[method + '_'];
          var middlewares = routes['_' + method + '_'];

          if (middlewares && typeof(middlewares) === 'function') {
            middlewares = [middlewares];
          }

          path = replaceAll || replaceMethod || path;
          path = path + (suffix ? suffix : '');

          trees.push([method, path, routes[method], middlewares]);
        }
      })
    };

    var includes = () => {
      var pp = [];  // Only paths
      var ps = [];  // Parameter paths

      // More specific paths are first.
      // /foo/bar is high priority than /foo
      // /foo/bar is high priority than /foo/:type

      trees.forEach((e, k) => {
        if (e[1].indexOf(':') === -1) pp.push(k);
        else ps.push(k);
      });

      pp.sort((a, b) => {
        var a1 = trees[a][1].split('/');
        var b1 = trees[b][1].split('/');

        if (a1.length > b1.length) return -1;
        if (a1.length < b1.length) return 1;

        if (trees[a][1] == trees[b][1]) return 0;
        if (trees[a][1] > trees[b][1]) return -1;
        return 1;
      });

      ps.sort((a, b) => {
        var a1 = trees[a][1].split('/');
        var b1 = trees[b][1].split('/');

        if (a1.length > b1.length) return -1;
        if (a1.length < b1.length) return 1;

        if (trees[a][1] == trees[b][1]) return 0;
        if (trees[a][1] > trees[b][1]) return -1;
        return 1;
      });

      pp.concat(ps).forEach((e) => {
        delegates.route.apply(this, trees[e]);
      });
    };

    traverse('', config.cfg.controller);
    includes();

    config.app.use((req, res, next) => {
      var ctrl = controller.delegate(config, req, res, session, cookie);
      controller.handler.serverError(ctrl, req, res, config, null, 404);
    });
  }

  return delegates
}
