'use strict';

var rev = _.extend(
  require('../../dist/js-rev.json'),
  require('../../dist/css-rev.json'),
  require('../../dist/assets-rev.json')
);

var staticPrefix = CONFIG.staticPrefix || '/dist';

'css js img'.split(' ').forEach(function (d) {
  global[d] = function (filePath) {
    var revvedFilePath = rev['/'+d+'/' + filePath];
    if (!revvedFilePath) return null;
    return staticPrefix + revvedFilePath;
  }
});
