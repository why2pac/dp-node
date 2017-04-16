module.exports = {
    delegate: (args, req, res) => {
        var module = {
            raw: () => {
                return {
                    req: req,
                    res: res
                }
            },
            params: (key) => {
                return req.body[key];
            },
            headers: (key) => {
                return req.get(key);
            },
            redirect: (url, statusCode) => {
                if (statusCode) {
                    res.redirect(url, statusCode)
                }
                else {
                    res.redirect(url)
                }
            },
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
