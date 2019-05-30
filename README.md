dp-node
=======

[![NPM Version](https://img.shields.io/npm/v/dp-node.svg)](https://npmjs.org/package/dp-node)
[![NPM Downloads](https://img.shields.io/npm/dm/dp-node.svg)](https://npmjs.org/package/dp-node)
[![Dependency Status](https://david-dm.org/why2pac/dp-node.svg)](https://david-dm.org/why2pac/dp-node)
[![Linux Build](https://img.shields.io/travis/why2pac/dp-node/master.svg?label=linux)](https://travis-ci.org/why2pac/dp-node)
[![Windows Build](https://img.shields.io/appveyor/ci/why2pac/dp-node/master.svg?label=windows)](https://ci.appveyor.com/project/why2pac/dp-node)

Faster, cheaper, better web framework for Node.js, built on top of express.

## Installation

```bash
$ npm install dp-node
```

## Features

  * Rapid prototyping
  * async / await ready

## Quick Start

### Directory Structure

```
App
　├─ controller
　│　　├─ foo
　│　　│　　├─ bar
　│　　│　　│　　└─ index.js
　│　　│　　└─ index.js
　│　　├─ bar
　│　　└─ index.js
　├─ model
　│　　├─ foo
　│　　│　　├─ bar
　│　　│　　│　　└─ index.js
　│　　│　　└─ index.js
　│　　├─ bar
　│　　└─ index.js
　├─ view
　│　　├─ foo
　│　　│　　├─ foo.html
　│　　│　　└─ bar.html
　│　　├─ bar
　│　　│　　└─ baz.html
　│　　└─ index.html
　└─ index.js
```

### Controller

#### App/controller/foo/bar/index.js / http://localhost/foo/bar

```Javascript
module.exports = {
    async get() {
        /*
         *  `this` exports: {
         *     raw: {
         *        req: return express `req` object.
         *        res: return express `res` object.
         *     }
         *     model: return model accessor
         *     session: return model accessor
         *     params: (key, isURL)
         *     headers: (key)
         *     redirect: (url, statusCode)
         *     render: (view, params)
         *     finish: (body)
         *     finisher: {
         *        notfound: (body)
         *        invalid: (body)
         *        error: (body)
         *     }
         *     finishWithCode: (code, body)
         *  }
         */

        var arg1 = 10;
        var arg2 = 20;
        var res = this.model.foo.bar.add(arg1, arg2);  // == 30

        var params = {
            arg1: arg1,
            arg2: arg2,
            res: res
        };

        await this.render('foo/foo.html', params);
    }
};
```

### Model

#### App/model/foo/bar/index.js / model.foo.bar

```Javascript
module.exports = {
    add(arg1, arg2) {
        /*
         *  `this` exports: {
         *     knex: (dsn)
         *     row: (query, params, dsn)
         *     rows: (query, params, dsn)
         *     execute: (query, params, dsn)
         *     tran: (blocks, dsn)
         *  }
         */

        return arg1 + arg2;
    }
};
```

### Helper

#### App/helper/foo/bar/index.js / helper.foo.bar

```Javascript
module.exports = {
    add(arg1, arg2) {
        /*
         *  `this` exports: helpers
         */

        return arg1 + arg2;
    }
};
```

### View

#### App/view/foo/foo.html / foo/foo.html

```HTML
<p>{{arg1}} + {{arg2}} = <strong>{{res}}</strong></p>
```

### Install

```bash
$ npm install dp-node
```

## Dependencies

* [Express](http://expressjs.com)
* [Knex.js](http://knexjs.org)
* [Handlebars.js](http://handlebarsjs.com)

## License

  [MIT](LICENSE)
