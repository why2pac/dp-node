**THIS PROJECT IS UNDER DEVELOPMENT, DO NOT USE IN PRODUCTION.**
----------------------------------------------------------------

# dp-node

Faster, cheaper, better web framework for Node.js, built on top of express.

## Installation

```bash
$ npm install dp-node
```

## Features

  * Focus on faster development.
  
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
    get: (controller) => {  // `controller` argument is required.
        /*
         *  `controller` exports: {
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
        var add = controller.model.foo.bar.add(arg1, arg2);  // == 30
        
        var params = {
            arg1: arg1,
            arg2: arg2,
            add: add
        };
        
        controller.render('foo/foo.html', params);
    }
};
```

### Model

#### App/model/foo/bar/index.js / model.foo.bar

```Javascript
module.exports = {
    add: (db, arg1, arg2) => {  // `db` argument is required.
        /*
         *  `db` exports: {
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

### View

#### App/view/foo/foo.html / foo/foo.html

```HTML
<p>{{arg1} + {{arg2}} = <strong>{{add}}</strong></p>
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
