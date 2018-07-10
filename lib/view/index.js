module.exports = (config) => {
  const viewEngine = require('./engine')(config)
  const path = require('path')

  return {
    render: async (view, params, opts) => {
      opts = opts || {}
      view = path.join(config.cfg.view, view)

      const rendered = await viewEngine.render(view, params, opts)
      return rendered
    }
  }
}
