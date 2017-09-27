/**
 * Module dependencies.
 */

var url = require('url'),
  qs = require('querystring')

/**
 * Helpers method
 *
 * @param {String} name
 * @return {Function}
 * @api public
 */

function helpers(name) {
  return function (req, res, next) {
    res.locals.appName = name || 'App'
    res.locals.title = name || 'App'
    res.locals.req = req
    res.locals.isActive = function (link) {
      if (link === '/') {
        return req.url === '/' ? 'active' : ''
      } else {
        return req.url.indexOf(link) !== -1 ? 'active' : ''
      }
    }
    res.locals.formatDate = formatDate
    res.locals.formatDatetime = formatDatetime
    res.locals.stripScript = stripScript
    res.locals.createPagination = createPagination(req)

    if (typeof req.flash !== 'undefined') {
      res.locals.info = req.flash('info')
      res.locals.errors = req.flash('error')
      res.locals.success = req.flash('success')
      res.locals.warning = req.flash('warning')
    }

    /**
     * Render mobile views
     *
     * If the request is coming from a mobile/tablet device, it will check if
     * there is a .mobile.ext file and it that exists it tries to render it.
     *
     * Refer https://github.com/madhums/nodejs-express-mongoose-demo/issues/39
     * For the implementation refer the above app
     */

    // For backward compatibility check if `app` param has been passed
    var ua = req.header('user-agent')
    var fs = require('fs')

    res._render = res.render
    req.isMobile = /mobile/i.test(ua)

    res.render = function (template, locals, cb) {
      var view = template + '.mobile.' + req.app.get('view engine')
      var file = req.app.get('views') + '/' + view

      if (/mobile/i.test(ua) && fs.existsSync(file)) {
        res._render(view, locals, cb)
      } else {
        res._render(template, locals, cb)
      }
    }

    next()
  }
}

module.exports = helpers

/**
 * Pagination helper
 *
 * @param {Number} pages
 * @param {Number} page
 * @return {String}
 * @api private
 */

function createPagination(req) {
  return function createPagination(pages, current) {
    var params = qs.parse(url.parse(req.url).query)
    var str = ''

    if (current == 1) {
      // str += '<li class="disabled"><a>First</a></li>'
      str += '<li class="active"><a>1</a></li>'
    } else {
      // str += '<li><a href="/products/1">First</a></li>'
      params.page = 1
      var href = '?' + qs.stringify(params)
      str += '<li><a href="' + href + '">1</a></li>'
    }

    var i = (Number(current) > 5 ? Number(current) - 4 + 1 : 2)
    if (i !== 2) {
      str += '<li class="disabled"><a>...</a></li>'
    }
    for (; i <= (Number(current) + 4) && i < pages; i++) {
      if (i == current) {
        str = str + '<li class="active"><a>' + i + '</a></li>'
      } else {
        params.page = i
        var href = '?' + qs.stringify(params)
        str += '<li><a href="' + href + '">' + i + '</a></li>'
      }
      if (i == Number(current) + 4 && i < pages) {
        str = str + '<li class="disabled"><a>...</a></li>'
      }
    }

    if (current == pages) {
      str += '<li class="active"><a>' + pages + '</a></li>'
      // str += '<li class="disabled"><a>Last</a></li>'
    } else {
      params.page = pages
      var href = '?' + qs.stringify(params)
      str += '<li><a href="' + href + '">' + pages + '</a></li>'
      // str += '<li><a href="/products/' + pages + '">Last</a></li>'
    }

    return str
  }
}

/**
 * Format date helper
 *
 * @param {Date} date
 * @return {String}
 * @api private
 */

function formatDate(date) {
  date = new Date(date)
  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear()
}

/**
 * Format date time helper
 *
 * @param {Date} date
 * @return {String}
 * @api private
 */

function formatDatetime(date) {
  date = new Date(date)
  var hour = date.getHours();
  var minutes = date.getMinutes() < 10 ?
    '0' + date.getMinutes().toString() :
    date.getMinutes();

  return formatDate(date) + ' ' + hour + ':' + minutes;
}

/**
 * Strip script tags
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function stripScript(str) {
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}