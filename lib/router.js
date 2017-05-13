const bodyParser = require('body-parser')
const bodyParserUrlEncoded = bodyParser.urlencoded({extended: true})
const controller = require('./controller')

module.exports = (config) => {
    var session = require('./controller/library/session')(config);
    var cookie = require('./controller/library/cookie')(config);

    var handler = (delegate, req, res) => {
        return async (() => {
            try {
                await (delegate(controller.delegate(config, req, res, session, cookie)))
            }
            catch (err) {
                controller.handler.serverError(req, res, config.handler.error, err);
            }
        })()
    }

    var delegates = {
        route: (method, path, delegate, replaceAll, replaceMethod, suffix) => {
            path = replaceAll || replaceMethod || path;
            path = path + (suffix ? suffix : '');

            if (method == 'get') {
                config.app.get(path, (req, res) => {
                    handler(delegate, req, res)
                })
            }
            else if (method == 'post') {
                config.app.post(path, bodyParserUrlEncoded, (req, res) => {
                    handler(delegate, req, res)
                })
            }
            else if (method == 'delete') {
                config.app.delete(path, bodyParserUrlEncoded, (req, res) => {
                    handler(delegate, req, res)
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

                    delegates.route(method, path, routes[method], replaceAll, replaceMethod, suffix);
                }
            })
        }

        traverse('', config.cfg.controller)
    }

    return delegates
}
