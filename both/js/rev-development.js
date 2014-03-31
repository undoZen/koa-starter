'use strict';

var path = require('path');

'css js img'.split(' ').forEach(function (d) {
  global[d] = function (filePath) {
    return path.join('/client', d, filePath);
  }
});
