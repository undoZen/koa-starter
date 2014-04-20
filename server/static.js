'use strict';

var fs = require('fs');
var path = require('path');
var less = require('less');

var browserify = require('browserify');
var thunkify = require('co-nth-arg').thunkify;

var readFile = thunkify(fs.readFile);

if ('development' == app.env) {

  app.use(koa.mount('/client', koa.static(path.join(__dirname, '..', 'client'), {defer: true})));
  app.use(koa.mount('/node_modules', koa.static(path.join(__dirname, '..', 'node_modules'), {defer: true})));
  app.use(koa.mount('/both', koa.static(path.join(__dirname, '..', 'both'), {defer: true})));

  //add global.css/js/img function
  require('../both/js/rev-development.js');

  global.jslib = function() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'client', 'js', 'lib.json'), 'utf-8'))
      .concat(['base.js', 'rev-development.js'])
      .map(global.js)
      .map(function (filePath) {
        return '<script src="' + filePath + '"></script>';
      })
      .join('');
  }

  app.use(koa.mount('/client/css', function *(next) {
    yield next;
    if (!this.idempotent || !this.path.match(/\.css$/i)) return;

    var filePath = path.join(__dirname, '..', 'client', 'css', this.path.replace(/\.css$/i, '.less'));
    if (!(yield L.exists(filePath))) return;
    this.status = 200;
    this.type = 'css';

    var lessContent = yield readFile(filePath, 'utf-8');
    var parser = new less.Parser({
        filename: filePath,
        paths: [path.dirname(filePath)]
    });
    try {
      var tree = yield parser.parse.bind(parser, lessContent);
      this.body = tree.toCSS({
        sourceMapBasepath: __dirname,
        sourceMapRootpath: 'file:///',
        sourceMap: true
      });
    } catch (err) {
      this.status = 500;
      this.body = '/*\n' + JSON.stringify(err, null, '  ') + '\n*/';
    }
  }));

  app.use(koa.mount('/client/js', function *(next) {
    yield next;
    if (!this.idempotent || !this.path.match(/\.js$/i)) return;

    var filePath = path.join(__dirname, '..', 'client', 'js', this.path);
    if (!(yield L.exists(filePath))) return;
    this.status = 200;
    this.type = 'js';
    try {
      this.body = yield L.browserify.thunk(filePath, { debug: true });
    } catch (e) {
      this.status = 500;
      var errMsg = e.toString()
      console.log(errMsg);
      this.body = '/*\n' + errMsg + '\n*/';
    }
  }));

} else if ('production' == app.env) {
  app.use(koa.mount('/dist', koa.static(path.join(__dirname, '..', 'dist'), {defer: true})));

  //add global.css/js/img function
  require('../both/js/rev-production.js');

  global.jslib = function() {
    return '<script src="' + (CONFIG.staticPrefix || '/dist') + '/' + require('../dist/js-lib-rev.json')['js/lib.js'] + '"></script>';
  }
}
