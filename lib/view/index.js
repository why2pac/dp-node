module.exports = (config) => {
    const viewEngine = require('./engine')(config)
    const path = require('path')

    return {
        render: async((req, res, view, params) => {
            view = path.join(config.cfg.view, view)
            return await(viewEngine.render(view, params))
        })
    }
}
