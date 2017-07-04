const qs = require('querystring');

var paginator = {
    tag: (page, path, params, text, tag, cls, key) => {
        if (path === null) {
            return '<' + tag + '>' + (text || page) + '</' + tag + '>';
        }

        var query = qs.stringify(params);
        query = key + '=' + page + (query ? '&' + query : '');
        path = path + '?' + query;
        cls = cls ? ' class="' + cls + '"' : '';

        return '<' + tag + ' href="' + path + '"' + cls + '>' + text + '</' + tag + '>';
    }
};

module.exports = (req, res, opts, addOpts) => {
    if (opts && opts.count === undefined) {
        if (typeof(opts[0]) === 'number' &&
                typeof(opts[1]) === 'object' &&
                typeof(opts[2]) === 'number' &&
                typeof(opts[3]) === 'number') {
            addOpts = addOpts || {};
            addOpts.count = opts[0];
            addOpts.page = opts[2];
            addOpts.rpp = opts[3];
            opts = addOpts;
        }
    }

    opts.page = opts.page || null;  // Current Page
    opts.rpp = opts.rpp || 20;  // Results per page
    opts.ppb = opts.ppb || 10;  // Pages per block
    opts.count = opts.count || 0;  // Items count

    opts.page = parseInt(opts.page, 10);
    opts.rpp = parseInt(opts.rpp, 10);
    opts.ppb = parseInt(opts.ppb, 10);
    opts.count = parseInt(opts.count, 10);

    opts.prev = opts.prev || '&lt;'  // Prev : <
    opts.prevClass = opts.prevClass || 'prev'  // Prev : <
    opts.next = opts.next || '&gt;'  // Next : >
    opts.nextClass = opts.nextClass || 'next'  // Next : >

    opts.first = opts.first || '&lt;&lt;'  // First : <<
    opts.firstClass = opts.firstClass || 'first'  // First : <<
    opts.last = opts.last || '&gt;&gt;'  // Last : >>
    opts.lastClass = opts.lastClass || 'last'  // Last : >>

    opts.linkTag = opts.linkTag || 'a';  // Page Link Tag
    opts.currentTag = opts.currentTag || 'strong';  // Current Page Tag
    opts.key = opts.key || 'page'  // URL Querystring Key

    var path = req.originalUrl.split('?')[0];
    var params = req.query;

    opts.page = opts.page || params.page || 1;
    delete params.page;

    var lastPage = Math.ceil(opts.count / opts.rpp);

    opts.page = Math.max(1, opts.page);
    opts.page = Math.min(lastPage, opts.page);

    var currentBlock = Math.ceil(opts.page / opts.ppb);
    var lastBlock = Math.ceil(lastPage / opts.ppb);

    var pages = [];

    var pageBegin = Math.max(1, (currentBlock - 1) * opts.ppb);
    var pageEnd = Math.min(lastPage, currentBlock * opts.ppb);

    if (currentBlock > 1) {
        // First
        if (opts.first != undefined) {
            pages.push(paginator.tag(1, path, params, opts.first, opts.linkTag, opts.firstClass, opts.key));
        }

        // Prev Block
        var page = ((currentBlock - 1) * opts.ppb) - 1;
        pages.push(paginator.tag(page, path, params, opts.prev, opts.linkTag, opts.prevClass, opts.key));
    }

    for (var i  = pageBegin; i <= pageEnd; i++) {
        if (opts.page == i) {
            pages.push(paginator.tag(i, null, null, i, opts.currentTag, null, opts.key));
        }
        else {
            pages.push(paginator.tag(i, path, params, i, opts.linkTag, null, opts.key));
        }
    }

    if (currentBlock < lastBlock) {
        // Prev Block
        var page = (currentBlock * opts.ppb) + 1;
        pages.push(paginator.tag(page, path, params, opts.next, opts.linkTag, opts.nextClass, opts.key));

        // Last
        if (opts.last != undefined) {
            pages.push(paginator.tag(lastPage, path, params, opts.last, opts.linkTag, opts.lastClass, opts.key));
        }
    }

    return pages.join('');
};
