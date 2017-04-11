global.async = require('asyncawait/async')
global.await = require('asyncawait/await')

module.exports = (args) => {
    var app = args ? args.app : null
    var config = {}

    config.cfg = {}
    config.cfg.controller = args.apppath + '/controller'
    config.cfg.view = args.apppath + '/view'

    config.delegate = {}
    config.delegate.error = args.error || undefined

    if (!app) {
        app = require('express')()
    }

    config.app = app
    config.view = require('./lib/view')(config)

    if (args.logging) {
        app.use(require('morgan')('short', {}))
    }

    const listen = (port) => {
        console.log('Listening .. ' + port)
        app.listen(port)
    }

    if (args.port) {
        listen(args.port)
    }

    return {
        app: app,
        listen: listen,
        router: require('./lib//router')(config)
    }
}
