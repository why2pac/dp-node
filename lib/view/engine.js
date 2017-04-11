module.exports = (config) => {
    const path = require('path')
    const fs = require('fs-promise')
    const promise = require('bluebird')
    const promisedHandlebars = require('promised-handlebars')
    const handlebars = promisedHandlebars(require('handlebars'), {Promise: promise})

    const pPrefix = '{{{dpPartial~~!'
    const pSuffix = '!~~dpPartial}}}'
    const pRegex = new RegExp('(' + pPrefix + ')(.*)(' + pSuffix + ')', 'g')
    const pWrapLen = pPrefix.length + pSuffix.length

    const render = async ((view, params) => {
        var html = await(fs.readFile(view, 'utf-8'))
        var template = await(handlebars.compile(html)(params || {}));

        (template.match(pRegex) || []).forEach((v) => {
            var subView = v.substr(pPrefix.length, v.length - pWrapLen)
            subView = path.join(path.dirname(view), subView)

            if (!subView.endsWith('.html')) {
                subView = subView + '.html'
            }

            var subTemplate = await(render(subView, params))
            template = template.replace(v, subTemplate)
        })

        return template
    })

    handlebars.registerHelper('include', (view, params) => {
        return pPrefix + view + pSuffix
    })

    return {
        render: render
    }
}
