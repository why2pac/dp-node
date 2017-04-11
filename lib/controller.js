module.exports = {
    delegate: (args, req, res) => {        
        var module = {
            render: (view, params) => {
                var renderString = await(args.view.render(req, res, view, params))
                module.finish(renderString)
            },
            finish: (body) => {
                module.finishWithCode(200, body)
            },
            finishWithCode: (code, body) => {
                res.status(code).send(body)
            }
        }
        
        return module
    }
}