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
        controller.handler.serverError(ctrl, req, res, config.handler.error, err);
      }
    })()
  }

  var delegates = {
    route: (method, path, delegate, replaceAll, replaceMethod, suffix, middlewares) => {
      path = replaceAll || replaceMethod || path;
      path = path + (suffix ? suffix : '');

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
        middlewares.forEach((middleware) => {
          params.push(middleware);
        });
      }

      // Add action
      params.push((req, res) => {
        handler(delegate, req, res)
      });

      if (fn) {
        fn.apply(config.app, params);
      }
    }
  }

  if (config.cfg.controller) {
    var fs = require('fs');

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
          include(
            name != 'index.js' ? path + '/' + name.substr(0, name.lastIndexOf('.')) : path,
            fullPath
          )
        }
      })
    }

    var include = (path, filePath) => {
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

          delegates.route(method, path, routes[method], replaceAll, replaceMethod, suffix, middlewares);
        }
      })
    }

    traverse('', config.cfg.controller)
  }

  return delegates
}
