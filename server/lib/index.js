'use strict';

var fs = require('fs');
var thunkify = require('co-nth-arg').thunkify;

exports.exists = thunkify(0, fs.exists);

exports.unary = function (fn) {
  return function (a) {
    return fn.call(this, a);
  }
}

exports.binary = function (fn) {
  return function (a, b) {
    return fn.call(this, a, b);
  }
}

exports.browserify = require('./browserify');
