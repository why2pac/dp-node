module.exports = (config) => {
  const path = require('path');
  const fs = require('fs-extra');
  const promise = require('bluebird');
  const promisedHandlebars = require('promised-handlebars');
  const handlebars = promisedHandlebars(require('handlebars'), {Promise: promise});
  const minifier = require('./minifier');
  const viewCache = config.debug ? null : [];

  const includeRegexStr = '{{( )?include "(.*)"( )?}}';
  const includeRegex = new RegExp(includeRegexStr, 'g');

  const load = async ((view, sub) => {
    var html;
    var key = view;

    // Cache : Hit
    if (viewCache && viewCache[key]) {
      return viewCache[key];
    }

    // Cache : Missing
    var html = await(fs.readFile(view, 'utf-8'));

    (html.match(includeRegex) || []).forEach((v) => {
      var name = new RegExp(includeRegexStr).exec(v)[2];
      name = path.join(path.dirname(view), name);

      if (!name.endsWith('.html')) {
        name = name + '.html'
      }

      var subTemplate = await(load(name, true));
      html = html.replace(v, subTemplate);
    });

    if (!sub) {
      html = await(minifier.html(html, config));
    }

    // Cache : Touch
    if (viewCache) {
      viewCache[key] = html;
    }

    return html
  });

  const render = async ((view, params) => {
    var html = await(load(view));
    var template = await(handlebars.compile(html)(params || {}));

    return template
  });

  // Handlbars-Helpers
  require('handlebars-helpers')({handlebars: handlebars});

  // Handlebars-Helper, Repeat
  handlebars.registerHelper('repeat', require('handlebars-helper-repeat'))

  // Handlebars-Helper, nl2br
  handlebars.registerHelper('nl2br', require('./helpers/nl2br')(handlebars))

  // Handlebars-Helper, pagingIdx
  handlebars.registerHelper('pagingIdx', require('./helpers/pagingIdx'));

  // Handlebars-Helper, pagingItems
  handlebars.registerHelper('pagingItems', require('./helpers/pagingItems'));

  Object.keys(config.cfg.viewHelpers).forEach((helper) => {
    handlebars.registerHelper(helper, config.cfg.viewHelpers[helper])
  });

  return {
    render: render
  }
}
