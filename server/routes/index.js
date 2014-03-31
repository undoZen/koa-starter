'use strict';

// For fast static prototyping, remove if you don't need it anymore
//*/
app.use(function *(next) {
  yield next;
  var path = require('path');
  var parse = require('co-body');

  var viewPath = path.join(__dirname, '..', 'views', this.path + '.jade');
  var viewExists = yield L.exists(viewPath);
  if (!this.body && viewExists) {
    if (this.idempotent) {
      this.type = 'html';
    } else {
      var body = yield parse(this);
      this.type = 'json';
      this.body = body;
    }
  }
});
//*/

app.use(route.idpt('/', function *(next) {
  this.type = 'html';
}));
