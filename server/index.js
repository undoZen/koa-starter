'use strict';

// from node
var path = require('path');

// from npm
var koa = require('koa');
var _ = require('lodash');
_.extend(koa, require('koa-common'));
var route = require('koa-route');
var thunkify = require('thunkify');
var views = require('co-views');
var parse = require('co-body');
var CONFIG = require('config');

// same project
var B = require('../both');
var L = require('./lib');

// module level variables
var app = koa();
var render = views(path.join(__dirname, 'views'), {ext: 'jade'});

// expose global variable
var SERVER_GLOBAL = '_ B L CONFIG koa app route';
SERVER_GLOBAL.split(' ').forEach(function (v) { GLOBAL[v] = eval(v); });

require('./patches');

var CLIENT_CONFIG = _.pick(CONFIG, CONFIG.CONFIG_EXPOSE_TO_CLIENT);
app.use(function *renderHtml(next) {
  this.locals = {CLIENT_CONFIG: CLIENT_CONFIG};
  yield next;
  if (this.type == 'text/html') {
    var view = this.view || this.path == '/' ? '/index' : this.path;
    var locals = _.extend({}, this.locals, this.body);
    this.body = yield render(view, locals);
  }
});

require('./static');
require('./routes');

app.listen(process.env.PORT || 4000);
