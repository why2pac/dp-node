module.exports = (config) => {
  const path = require('path'); // eslint-disable-line global-require
  const fs = require('fs-extra'); // eslint-disable-line global-require
  const promisedHandlebars = require('promised-handlebars'); // eslint-disable-line global-require
  const handlebars = promisedHandlebars(require('handlebars')); // eslint-disable-line global-require
  const minifier = require('./minifier'); // eslint-disable-line global-require
  const viewCache = config.debug ? null : [];

  const includeRegexStr = '{{( )?include "(.*)"( )?}}';
  const includeRegex = new RegExp(includeRegexStr, 'g');

  const optsToKeySuffix = (opts) => {
    if (opts.doNotMinify) {
      return '--origin';
    }

    return '';
  };

  const load = async (view, sub, opts) => {
    const key = view + optsToKeySuffix(opts);

    // Cache : Hit
    if (viewCache && viewCache[key]) {
      return viewCache[key];
    }

    // Cache : Missing
    let html = await fs.readFile(view, 'utf-8');
    const matches = html.match(includeRegex) || [];

    for (let i = 0; i < matches.length; i += 1) {
      let name = new RegExp(includeRegexStr).exec(matches[i])[2];
      name = path.join(path.dirname(view), name);

      if (!name.endsWith('.html')) {
        name += '.html';
      }

      // eslint-disable-next-line no-await-in-loop
      const subTemplate = await load(name, true, opts);
      html = html.replace(matches[i], subTemplate);
    }

    if (!sub && !opts.doNotMinify) {
      html = await minifier.html(html, config);
    }

    // Cache : Touch
    if (viewCache) {
      viewCache[key] = html;
    }

    return html;
  };

  const render = async (view, params, opts) => {
    const html = await load(view, undefined, opts);
    const template = await handlebars.compile(html)(params || {});

    return template;
  };

  // Handlbars-Helpers
  // eslint-disable-next-line global-require
  require('handlebars-helpers')({ handlebars });

  // Handlebars-Helper, Repeat
  // eslint-disable-next-line global-require
  handlebars.registerHelper('repeat', require('handlebars-helper-repeat'));

  // Handlebars-Helper, nl2br
  // eslint-disable-next-line global-require
  handlebars.registerHelper('nl2br', require('./helpers/nl2br')(handlebars));

  // Handlebars-Helper, pagingIdx
  // eslint-disable-next-line global-require
  handlebars.registerHelper('pagingIdx', require('./helpers/pagingIdx'));

  // Handlebars-Helper, pagingItems
  // eslint-disable-next-line global-require
  handlebars.registerHelper('pagingItems', require('./helpers/pagingItems'));

  Object.keys(config.cfg.viewHelpers).forEach((helper) => {
    handlebars.registerHelper(helper, config.cfg.viewHelpers[helper]);
  });

  return {
    render,
  };
};
