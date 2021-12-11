nunjucks-date-filter-local
==========================

This defines a `date` filter for [Nunjucks](http://mozilla.github.io/nunjucks/) 
implementing [moment.js](http://momentjs.com/), a rich date manager.

```shell
npm install nunjucks-date-filter-local --save
```

This repository is forked from [nunjucks-date-filter](https://github.com/e-picas/nunjucks-date-filter).

Instead of using `moment.utc()`, this library use local timezone to output date. (See [#4](https://github.com/e-picas/nunjucks-date-filter/issues/4))

### Usage

```js
var dateFilter = require('nunjucks-date-filter-local');

var env = new nunjucks.Environment();

env.addFilter('date', dateFilter);
```
