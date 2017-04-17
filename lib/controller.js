module.exports = {
    delegate: (config, req, res) => {
        var controller = {
            raw: () => {
                return {
                    req: req,
                    res: res
                }
            },
            model: config.model,
            params: (key) => {
                return req.body[key]
            },
            headers: (key) => {
                return req.get(key)
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
                var renderString = await(config.view.render(req, res, view, params));
                controller.finish(renderString);
            },
            finish: (body) => {
                controller.finishWithCode(200, body)
            },
            finisher: {
                notfound: function(body) {
                    controller.finishWithCode(404, body)
                },
                error: function(body) {
                    controller.finishWithCode(500, body)
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

        return controller;
    }
}
