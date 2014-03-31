'use strict';

var browserify = require('browserify')

exports = module.exports = browserifyStream;

function browserifyStream(opts) {
  var b = browserify(opts);
  b.transform(require('browserify-jade'));
  return b;
}

exports.thunk = function (filePath, opts) {
  var b = browserifyStream(filePath);
  return opts ? b.bundle.bind(b, opts) : b.bundle.bind(b);
}
