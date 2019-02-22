'use strict';

const { join, dirname } = require('path');
const fs = require('fs');
const promisedHandlebars = require('promised-handlebars');
const handlebars = require('handlebars');
const minifier = require('./minifier');

const handlebarsP = promisedHandlebars(handlebars);

const wrapProgram = (program, loc) => ({
  type: 'BlockStatement',
  path: {
    type: 'PathExpression', data: false, depth: 0, parts: ['if'], original: 'if', loc,
  },
  params: [
    {
      type: 'BooleanLiteral', value: true, original: true, loc,
    },
  ],
  hash: undefined,
  program,
  inverse: undefined,
  openStrip: { open: false, close: false },
  inverseStrip: undefined,
  endStrip: { open: false, close: false },
  loc,
});

const forEachIncludes = (ast, fn) => {
  const visitor = new handlebars.Visitor();
  if (typeof visitor.MustacheStatement !== 'function') {
    throw new Error('unsupported handlebars version');
  }
  visitor.MustacheStatement = (mustache) => {
    const { path, params } = mustache;
    if (path && path.original === 'include' && params) {
      const [patternExpr] = params;
      if (patternExpr && patternExpr.type === 'StringLiteral'
          && typeof patternExpr.value === 'string') {
        fn(patternExpr.value, mustache);
      }
    }
  };
  visitor.accept(ast);
  return ast;
};

module.exports = (config) => {
  const viewCache = config.debug ? null : Object.create(null);

  const optsToKeySuffix = (opts) => {
    if (opts.doNotMinify) {
      return '@';
    }

    return '#';
  };

  const load = (view, opts) => {
    const key = view + optsToKeySuffix(opts);

    // Cache : Hit
    if (viewCache && viewCache[key]) return viewCache[key];

    // Cache : Missing
    const promise = new Promise((resolve, reject) => {
      fs.readFile(view, 'utf-8', (err, res) => {
        if (err != null) {
          reject(err);
        } else {
          try {
            if (!opts.doNotMinify) {
              // eslint-disable-next-line no-param-reassign
              res = minifier.html(res, config);
            }
          } catch (e) {
            reject(e);
            return;
          }
          resolve(res);
        }
      });
    }).then((html) => {
      const ast = handlebars.parse(html);
      if (typeof ast.then === 'function') {
        throw Error("require('handlebars').parse returned a Promise-like object");
      }

      return new Promise((resolve, reject) => {
        let wait = 0;

        const rejFunc = (reason) => {
          if (wait >= 0) {
            wait = -2;
            return reject(reason); // tail call
          }
          return undefined;
        };

        const doneFunc = () => {
          if (wait > 0) {
            wait -= 1;
          } else if (wait === 0) {
            return resolve(ast); // tail call
          }
          return undefined;
        };

        const func = (name, mustache) => {
          let file = join(dirname(view), name);
          if (!file.endsWith('.html')) {
            file += '.html';
          }

          if (wait < 0) throw new Error('Fast fail');
          wait += 1;

          load(file, true, opts).then((program) => {
            const dest = mustache;
            // eslint-disable-next-line no-param-reassign
            mustache = null; // allow garbage collection
            if (!dest || wait < 0) return undefined;

            try {
              const block = wrapProgram(program, dest.loc);
              // eslint-disable-next-line no-restricted-syntax, guard-for-in
              for (const dk in dest) {
                delete dest[dk]; // will do nothing if not own property
              }
              Object.assign(dest, block);
            } catch (e) {
              return rejFunc(e); // tail call
            }
            return doneFunc(); // tail call
          }, rejFunc);
        };

        try {
          forEachIncludes(ast, func);
        } catch (e) {
          return rejFunc(e); // tail call
        }
        return doneFunc(); // final "done", tail call
      });
    });

    // Cache : Touch
    // NOTE we cache the Promise itself so that pending loads are properly handled
    if (viewCache) viewCache[key] = promise;

    return promise;
  };

  const compiledCache = Symbol('dp-node.compiledCache');

  const render = (view, params, opts) => load(view, opts).then((ast) => {
    let fn = ast[compiledCache];
    if (typeof fn === 'undefined') {
      fn = handlebarsP.compile(ast);
      Object.defineProperty(ast, compiledCache, {
        value: fn,
        writable: false,
        enumerable: false, /* so that Object.assign above doesn't copy this */
        configurable: true,
      });
    }
    return fn(params || {});
  });

  // Handlbars-Helpers
  require('handlebars-helpers')({ handlebarsP });

  // Handlebars-Helper, Repeat
  handlebarsP.registerHelper('repeat', require('handlebars-helper-repeat'));

  // Handlebars-Helper, nl2br
  handlebarsP.registerHelper('nl2br', require('./helpers/nl2br')(handlebarsP));

  // Handlebars-Helper, pagingIdx
  handlebarsP.registerHelper('pagingIdx', require('./helpers/pagingIdx'));

  // Handlebars-Helper, pagingItems
  handlebarsP.registerHelper('pagingItems', require('./helpers/pagingItems'));

  Object.entries(config.cfg.viewHelpers).forEach(([helper, object]) => {
    handlebarsP.registerHelper(helper, object);
  });

  return {
    render,
  };
};
