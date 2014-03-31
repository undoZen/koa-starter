'use strict';

var compose = require('koa-compose');

// turn off 'X-Powered-By' header
app.poweredBy = false;

require('koa/lib/context').__defineGetter__('xhr', function(){
  var val = this.get('X-Requested-With') || '';
  return 'xmlhttprequest' == val.toLowerCase();
});

//app.use(koa.favicon());

route.idpt = function (path, fn) {
  return compose([route.get(path, fn), route.head(path, fn)]);
}
