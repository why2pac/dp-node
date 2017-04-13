const bodyParser = require('body-parser')
const bodyParserUrlEncoded = bodyParser.urlencoded({extended: true})
const controller = require('./controller')

module.exports = (config) => {
    var handler = (module, req, res) => {
        return async (() => {
            try {
                await (module(controller.delegate(config, req, res)))
            }
            catch (err) {
                console.error('-------')
                console.error('[ERROR]')
                console.error('-------')
                console.error(err)
                console.error('-------')

                if (config.delegate.error) {
                    config.delegate.error(method, path, err)
                }
                else {
                    res.status(500).send('An error has occurred.')
                }
            }
        })()
    }

    var modules = {
        route: (method, path, module, replaceAll, replaceMethod, suffix) => {
            path = replaceAll || replaceMethod || path;
            path = path + (suffix ? suffix : '');

            if (method == 'get') {
                config.app.get(path, (req, res) => {
                    handler(module, req, res)
                })
            }
            else if (method == 'post') {
                config.app.post(path, bodyParserUrlEncoded, (req, res) => {
                    handler(module, req, res)
                })
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

                    modules.route(method, path, routes[method], replaceAll, replaceMethod, suffix);
                }
            })
        }

        traverse('', config.cfg.controller)
    }

    return modules
}
