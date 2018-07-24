const createHttpError = require('http-errors')
const bodyParser = require('body-parser')
const controller = require('./controller')
const dpError = require('./misc/dp_error')
const url = require('url')
const ini = require('ini')

module.exports = (config) => {
  var session = require('./controller/library/session')(config)
  var cookie = require('./controller/library/cookie')(config)

  var bodyParserUrlEncodedOpts = {extended: true}

  if (config.cfg.requestSizeLimit !== undefined) {
    bodyParserUrlEncodedOpts.limit = config.cfg.requestSizeLimit
  }

  // Assign engine when test mode enabled.
  if (global.isTest) {
    global.__dpSessionEngine__ = session
  }

  var bodyParserUrlEncoded = bodyParser.urlencoded(bodyParserUrlEncodedOpts)

  var handler = async (delegate, req, res, data) => {
    const ctrl = controller.delegate(config, req, res, session, cookie)
    const hdl = await delegate(ctrl, data)
    return hdl
  }

  var finalizeMiddleware = (req, res, next) => {
    if (res.bufferRedirect) {
      if (res.bufferRedirect.code) {
        res.redirect(res.bufferRedirect.url, res.bufferRedirect.code)
      } else {
        res.redirect(res.bufferRedirect.url)
      }
    } else if (res.buffer && res.buffer.body === undefined) {
      res.status(204).send()
    } else if (res.buffer) {
      res.status(res.buffer.code).send(res.buffer.body)
    } else {
      res.status(204).send()
    }
  }

  var delegates = {
    route: (method,
      path,
      delegate,
      middlewares,
      middlewaresEnd,
      controllerPrefix,
      controllerSuffix,
      controllerErrorHandler) => {
      var params = [path]
      var fn

      if (method === 'get') {
        fn = config.app.get
      } else if (method === 'post') {
        fn = config.app.post
        params.push(bodyParserUrlEncoded)
      } else if (method === 'delete') {
        fn = config.app.delete
        params.push(bodyParserUrlEncoded)
      } else if (method === 'put') {
        fn = config.app.put
        params.push(bodyParserUrlEncoded)
      }

      // Add middlewares
      if ((middlewares && typeof (middlewares) === 'object') ||
          (middlewaresEnd && typeof (middlewaresEnd) === 'object')) {
        params.push((req, res, next) => {
          var dp = async (callback) => {
            var ctrl = controller.delegate(config, req, res, session, cookie)
            var handler = {
              controller: ctrl,
              helper: config.helper,
              model: config.model
            }

            try {
              await (callback(handler))
            } catch (err) {
              controller.handler.serverError(ctrl, req, res, config, new dpError(err, req), 500) // eslint-disable-line
            }
          }

          req.async = dp
          res.async = dp

          next()
        })
      }

      // Add middlewares
      if (middlewares && typeof (middlewares) === 'object') {
        middlewares.forEach((middleware) => {
          params.push(middleware)
        })
      }

      var isAvailableMiddlewaresForEnd = middlewaresEnd && typeof (middlewaresEnd) === 'object'

      var resPrev = {}

      var finalizeController = (req, res, next, done, resKey, error) => {
        done.then((resp) => {
          if (typeof (res.buffer) === 'undefined' && resp) {
            if (resKey) {
              resPrev[resKey] = resp
            } else {
              res.buffer = {
                code: error ? 500 : 200,
                body: resp
              }
            }
          } else if (resp === true && isAvailableMiddlewaresForEnd) {
            finalizeMiddleware(req, res)
            return
          }

          next()
        }).catch((err) => {
          if (controllerErrorHandler && !error) {
            next(err)
            return
          }

          var ctrl = controller.delegate(config, req, res, session, cookie)
          controller.handler.serverError(ctrl, req, res, config, new dpError(err, req), 500) // eslint-disable-line
        })
      }

      if (controllerPrefix) {
        params.push((req, res, next) => {
          var done = handler(controllerPrefix, req, res)
          finalizeController(req, res, next, done, 'prefix')
        })
      }

      // Add action
      params.push((req, res, next) => {
        var done = handler(delegate, req, res, resPrev['prefix'])
        finalizeController(req, res, next, done, controllerSuffix ? 'body' : null)
      })

      if (controllerSuffix) {
        params.push((req, res, next) => {
          var done = handler(controllerSuffix, req, res, resPrev['body'])
          finalizeController(req, res, next, done)
        })
      }

      // Add middlewares for end
      if (isAvailableMiddlewaresForEnd) {
        middlewaresEnd.forEach((middleware) => {
          params.push(middleware)
        })
      }

      // Error handling on controller
      if (controllerErrorHandler) {
        params.push((err, req, res, next) => {
          var done = handler(controllerErrorHandler, req, res, err)
          finalizeController(req, res, next, done, null, true)
        })
      }

      params.push(finalizeMiddleware)

      // Error handling globally.
      params.push((err, req, res, next) => {
        var ctrl = controller.delegate(config, req, res, session, cookie)
        controller.handler.serverError(ctrl, req, res, config, new dpError(err, req), 500) // eslint-disable-line
      })

      if (fn) {
        fn.apply(config.app, params)
      }
    }
  }

  if (config.cfg.controller) {
    var fs = require('fs')
    var trees = []
    var configs = []
    var globalMiddlewaresFirst = []
    var globalMiddlewaresEnd = []
    var globalControllerFirst = []
    var globalControllerEnd = []
    var globalErrorHandler = []

    var findConfig = (path) => {
      for (var i = 0; i < configs.length; i++) {
        if (path.indexOf(configs[i][0]) === 0) {
          return configs[i][1]
        }
      }

      return null
    }

    var traverse = (path, dirPath) => {
      try {
        if (!fs.statSync(dirPath).isDirectory()) {
          return
        }
      } catch (_) {
        console.error('Controller path load error, ' + dirPath)
        return
      }

      var files = fs.readdirSync(dirPath)

      files.sort((a, b) => {
        if (a.indexOf('_.') === 0 || a.indexOf('__.') === 0 || a.indexOf('.') === 0) return -1
        return 1
      })

      files.forEach(function (name) {
        var fullPath = dirPath + '/' + name

        if (name.startsWith('.') &&
            name !== '.dp' &&
            name !== '.pre.js' &&
            name !== '.post.js' &&
            name !== '.err.js') {
          return
        } else if (name === '.dp') {
          // Configs
          var dpIni = ini.parse(fs.readFileSync(fullPath, 'utf-8'))
          dpIni._ = path

          if (dpIni && dpIni.path && dpIni.path.prefix) {
            dpIni.path.prefix = dpIni.path.prefix + (dpIni.path.prefix.slice(-1) === '/' ? '' : '/')
          }

          configs.unshift([dirPath, dpIni])
          return
        }

        if (fs.statSync(fullPath).isDirectory()) {
          traverse(path + '/' + name, fullPath)
        } else {
          var config = findConfig(dirPath)
          var subPath = name !== 'index.js' ? path + '/' + name.substr(0, name.lastIndexOf('.')) : path

          if (config && config.path && config.path.prefix) {
            var a = subPath.slice(0, config._.length) + '/'
            var b = subPath.slice(config._.length + 1)
            subPath = url.resolve(a, config.path.prefix)
            subPath = url.resolve(subPath, b)
            subPath = subPath.slice(-1) === '/' ? subPath.slice(0, -1) : subPath
          }

          includePreapre(subPath, fullPath, config)
        }
      })
    }

    var findMiddleware = (path, isFirst) => {
      var middlewares

      if (isFirst) {
        middlewares = globalMiddlewaresFirst
      } else {
        middlewares = globalMiddlewaresEnd
      }

      for (var i = 0; i < middlewares.length; i++) {
        if (path.indexOf(middlewares[i][0]) === 0 &&
            (path === middlewares[i][0] ||
             path.slice(middlewares[i][0].length, middlewares[i][0].length + 1) === '/')) {
          return middlewares[i][1]
        }
      }

      return null
    }

    var findController = (path, isFirst) => {
      var controllers

      if (isFirst) {
        controllers = globalControllerFirst
      } else {
        controllers = globalControllerEnd
      }

      for (var i = 0; i < controllers.length; i++) {
        if (path.indexOf(controllers[i][0]) === 0 &&
            (path === controllers[i][0] ||
             path.slice(controllers[i][0].length, controllers[i][0].length + 1) === '/')) {
          return controllers[i][1]
        }
      }

      return null
    }

    var findErrorHandler = (path, isFirst) => {
      for (var i = 0; i < globalErrorHandler.length; i++) {
        if (path.indexOf(globalErrorHandler[i][0]) === 0 &&
            (path === globalErrorHandler[i][0] ||
             path.slice(globalErrorHandler[i][0].length, globalErrorHandler[i][0].length + 1) === '/')) {
          return globalErrorHandler[i][1]
        }
      }

      return null
    }

    var includePreapre = (path, filePath, config) => {
      if (!fs.statSync(filePath).isFile()) { return false }

      // Middleware for begin
      if (filePath.lastIndexOf('/_.') === filePath.length - 5) {
        let middleware = require(filePath)
        globalMiddlewaresFirst.unshift([path.slice(0, -2), middleware])
        return
      } else if (filePath.lastIndexOf('/__.') === filePath.length - 6) {
        // Middleware for end
        let middleware = require(filePath)
        globalMiddlewaresEnd.unshift([path.slice(0, -3), middleware])
        return
      } else if (filePath.lastIndexOf('/.pre.') === filePath.length - 8) {
        // Controller for begin
        let middleware = require(filePath)
        globalControllerFirst.unshift([path.slice(0, -5), middleware])
        return
      } else if (filePath.lastIndexOf('/.post.') === filePath.length - 9) {
        // Controller for end
        let middleware = require(filePath)
        globalControllerEnd.unshift([path.slice(0, -6), middleware])
        return
      } else if (filePath.lastIndexOf('/.err.') === filePath.length - 8) {
        // Controller for end
        let middleware = require(filePath)
        globalErrorHandler.unshift([path.slice(0, -5), middleware])
        return
      }

      var routes = require(filePath)
      var middlewareForGlobal = findMiddleware(path, true)
      var middlewareForGlobalEnd = findMiddleware(path, false)
      var controllerForGlobal = findController(path, true)
      var controllerForGlobalEnd = findController(path, false)
      var errorHandlerGlobal = findErrorHandler(path)
      var methods = ['get', 'post', 'delete', 'put']

      methods.forEach((method) => {
        if (typeof routes[method] === 'function') {
          var replaceAll = routes.path || routes['_']
          var replaceMethod = routes[method + 'Path'] ||
                              routes['_' + method] // getPath, _get
          var suffix = routes[method + 'Suffix'] ||
                       routes[method + '_'] // getSuffix, get_
          var middlewaresForAll = routes['middlewares'] ||
                                  routes['middleware'] ||
                                  routes['__']
          var middlewares = routes[method + 'Middlewares'] ||
                            routes[method + 'Middleware'] ||
                            routes['_' + method + '_'] // getMiddlewares, getMiddleware, _get_

          var controllerPrefix = controllerForGlobal
            ? (controllerForGlobal[method] || controllerForGlobal.all)
            : null
          var controllerSuffix = controllerForGlobalEnd
            ? (controllerForGlobalEnd[method] || controllerForGlobalEnd.all)
            : null

          if (middlewareForGlobal && typeof (middlewareForGlobal) === 'function') {
            middlewareForGlobal = [middlewareForGlobal]
          }

          if (middlewareForGlobalEnd && typeof (middlewareForGlobalEnd) === 'function') {
            middlewareForGlobalEnd = [middlewareForGlobalEnd]
          }

          if (middlewaresForAll && typeof (middlewaresForAll) === 'function') {
            middlewaresForAll = [middlewaresForAll]
          }

          if (middlewares && typeof (middlewares) === 'function') {
            middlewares = [middlewares]
          }

          // replace url by .dp config
          if (config && config.path && config.path.prefix) {
            if (replaceAll) {
              replaceAll = (replaceAll.slice(0, 1) === '/' ? config.path.prefix.slice(0, -1) : config.path.prefix) + replaceAll
            } else if (replaceMethod) {
              replaceMethod = (replaceMethod.slice(0, 1) === '/' ? config.path.prefix.slice(0, -1) : config.path.prefix) + replaceMethod
            }
          }

          var middleware = middlewares || middlewaresForAll || middlewareForGlobal
          var routePath = replaceAll || replaceMethod || path

          routePath = routePath + (suffix || '')

          trees.push([
            method,
            routePath,
            routes[method],
            middleware,
            middlewareForGlobalEnd,
            controllerPrefix,
            controllerSuffix,
            errorHandlerGlobal
          ])
        }
      })
    }

    var includes = () => {
      var pp = [] // Only paths
      var ps = [] // Parameter paths

      // More specific paths are first.
      // /foo/bar is high priority than /foo
      // /foo/bar is high priority than /foo/:type

      trees.forEach((e, k) => {
        if (e[1].indexOf(':') === -1) pp.push(k)
        else ps.push(k)
      })

      pp.sort((a, b) => {
        var a1 = trees[a][1].split('/')
        var b1 = trees[b][1].split('/')

        if (a1.length > b1.length) return -1
        if (a1.length < b1.length) return 1

        if (trees[a][1] === trees[b][1]) return 0
        if (trees[a][1] > trees[b][1]) return -1
        return 1
      })

      ps.sort((a, b) => {
        var a1 = trees[a][1].split('/')
        var b1 = trees[b][1].split('/')

        if (a1.length > b1.length) return -1
        if (a1.length < b1.length) return 1

        if (trees[a][1] === trees[b][1]) return 0
        if (trees[a][1] > trees[b][1]) return -1
        return 1
      })

      pp.concat(ps).forEach((e) => {
        delegates.route.apply(this, trees[e])
      })
    }

    traverse('', config.cfg.controller)
    includes()

    config.app.use(async (req, res, next) => {
      var ctrl = controller.delegate(config, req, res, session, cookie)

      try {
        var errorHandlerGlobal = findErrorHandler(req.url)

        if (typeof errorHandlerGlobal === 'function') {
          const httpError = new createHttpError.NotFound()
          httpError.code = 404

          const resp = await errorHandlerGlobal(ctrl, httpError)

          if (!res.buffer) {
            res.buffer = {
              code: 404,
              body: resp || '404 Page Notfound'
            }
          }

          return finalizeMiddleware(req, res)
        }
      } catch (e) {
        console.error(e)
      }

      controller.handler.serverError(ctrl, req, res, config, new dpError('404 Page Notfound', req), 404) // eslint-disable-line
    })
  }

  return delegates
}
