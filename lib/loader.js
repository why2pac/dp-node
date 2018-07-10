const fs = require('fs')
const camelize = require('camelcase')
const decamelize = require('decamelize')

const isFile = (path) => {
  try {
    return fs.statSync(path).isFile()
  } catch (_) {
    return false
  }
}

const isDir = (path) => {
  try {
    return fs.statSync(path).isDirectory()
  } catch (_) {
    return false
  }
}

const tryRequire = (path, method) => {
  try {
    required = require(`${path}/${method}`)
    return [required, method, null, true]
  } catch (e) {
    var isFileExists =
      isFile(`${path}/${method}.js`) ||
      isFile(`${path}/${method}/index.js`)
    var isLoadable = isFileExists || isDir(`${path}/${method}`)
    return [null, method, isFileExists ? e : null, isLoadable]
  }
}

const loadize = (load) => {
  return {
    module: load[0],
    method: load[1],
    error: load[2]
  }
}
const tryRequires = (path, method) => {
  var required = null

  // Requested
  var loadReq = tryRequire(path, method)

  if (loadReq[0] || loadReq[2]) {
    return loadize(loadReq)
  }

  // Decamelized
  var loadDec = tryRequire(path, decamelize(method))

  if (loadDec[0] || loadDec[2]) {
    return loadize(loadDec)
  }

  // Camelized
  var loadCam = tryRequire(path, camelize(method))

  if (loadCam[0] || loadCam[2]) {
    return loadize(loadCam)
  }

  if (loadReq[3]) {
    method = loadReq[1]
  } else if (loadDec[3]) {
    method = loadDec[1]
  } else if (loadCam[3]) {
    method = loadCam[1]
  }

  return loadize([null, method, null])
}

var loader = (delegate, path, parent, config) => {
  var loaded = parent || {}
  var proxy = new Proxy(loaded, {
    get: (target, method) => {
      if (method in target) {
        return target[method]
      }

      if (typeof method === 'string') {
        var load = tryRequires(path, method)
        var ccMethod = camelize(method)
        var dccMethod = decamelize(method)

        if (load.error) {
          throw load.error
        } else if (load.module) {
          var closured = {}

          Object.keys(load.module).forEach((fn) => {
            closured[fn] = (...args) => {
              if (typeof (delegate) === 'string') {
                return load.module[fn].apply(this, [config[delegate]].concat(args))
              } else {
                return load.module[fn].apply(this, [delegate].concat(args))
              }
            }
          })

          loaded[method] = loader(delegate, `${path}/${load.method}`, closured, config)
          loaded[ccMethod] = loaded[method]
          loaded[dccMethod] = loaded[method]

          return loaded[method]
        } else {
          var loadablePath = load.method || method
          loaded[method] = loader(delegate, `${path}/${loadablePath}`, undefined, config)
          loaded[ccMethod] = loaded[method]
          loaded[dccMethod] = loaded[method]

          return loaded[method]
        }
      }

      loaded[method] = null
      return null
    }
  })

  return proxy
}

module.exports = (delegate, path, config) => {
  return loader(delegate, path, undefined, config)
}
