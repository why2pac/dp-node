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
            finisher: {
                notfound: function(body) {
                    module.finishWithCode(404, body)
                },
                error: function(body) {
                    module.finishWithCode(500, body)
                }
            },
            finishWithCode: (code, body) => {
                if (!body) {
                    if (code == 404) {
                        body = 'Page not found.'
                    }
                    else if (code == 403) {
                        body = 'Forbidden.'
                    }
                    else if (500 <= code < 600) {
                        body = 'An error has occurred.'
                    }
                }

                res.status(code).send(body)
            }
        }

        return module
    }
}
