'use strict';

var path = require('path');
var fs = require('fs');

var config = require('config');
var gulp = require('gulp');
var through = require('through2');
var streamQueue = require('streamqueue');
var streamCombine = require('stream-combiner');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var minifyCSS = require('gulp-minify-css');
var clean = require('gulp-clean');
var rev = require('gulp-rev');
var rename = require('gulp-rename');
var _ = require('lodash');

var L = require('./server/lib');

function src(glob, opts) {
  var xopts = {cwd: __dirname}
  opts = opts ? _.extend(xopts, opts) : xopts;
  return gulp.src.call(gulp, glob, opts);
}

function dest(filePath) {
  return gulp.dest(path.join(__dirname, filePath));
}

function browserify() {
  return through.obj(function (obj, enc, cb) {
    var self = this;
    L.browserify(obj.path).bundle(function (err, contents) {
      if (err) console.log(err);
      obj.contents = new Buffer(contents);
      self.push(obj);
      cb()
    });
  });
}

function sJs() {
  return src(['./client/js/**/*.js', '!./client/js/base.js', '!./client/js/rev-development.js', '!./client/js/rev-production.js'], {read: false})
    .pipe(browserify())
    .pipe(uglify())
    //.pipe(dest('./dist/js/'));
}

function sJsLib() {
  var libFiles = require('./client/js/lib.json')
    .map(L.unary(path.join.bind(path, __dirname, 'client', 'js')));
  return streamQueue({objectMode: true},
      src(libFiles),
      src('./client/js/base.js', {read: false}).pipe(browserify()),
      src('./client/js/rev-production.js', {read: false}).pipe(browserify())
    )
    .pipe(uglify())
    .pipe(concat('lib.js'))
    .pipe(through.obj(function (obj, enc, cb) {
      obj.base = path.join(__dirname, 'client');
      obj.path = path.join(__dirname, 'client', 'js', path.basename(obj.path));
      this.push(obj);
      cb();
    }))
    //.pipe(dest('./dist/js'));
}

function sLess() {
  return src('./client/css/**/*.less')
    .pipe(less())
    .pipe(minifyCSS())
    //.pipe(dest('./dist/css'));
}

function sFonts() {
  return src('./client/font/**/*.*')
    //.pipe(dest('./dist/img'));
}

function sImgs() {
  return src('./client/img/**/*.*')
    //.pipe(dest('./dist/img'));
}

gulp.task('clean', function () {
  return src('./dist', {read: false})
    .pipe(clean())
});

function tRev() {
  return streamCombine(
    through.obj(function (obj, enc, cb) {
      obj.base = path.join(__dirname, 'client'); // keep dir structure
      this.push(obj);
      cb();
    }),
    rev()
  );
}

function tDest(type) {
  return streamCombine(
    dest('dist'),  // write revisioned assets to /dist
    rev.manifest(),     // generate a revision manifest file
    rename(type + '-rev.json'),     // generate a revision manifest file
    dest('dist') // write it to /dist/rev-manifest.json
  );
}

gulp.task('build-js', ['clean'], function () {
  return sJs()
    .pipe(tRev())
    .pipe(tDest('js'))
});

gulp.task('build-assets', ['clean'], function () {
  return streamQueue({objectMode: true},
      sImgs(),
      sFonts()
    )
    .pipe(tRev())
    .pipe(tDest('assets'))
});

gulp.task('build-css', ['clean', 'build-assets'], function () {
  var revMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'dist', 'assets-rev.json'), 'utf-8'));
  var filePathRegex = /([\(\'\"])((?:\.\.\/img\/|\.\.\/font\/)[^\'\"\)]*)([\'\"\)])/ig;
  return sLess()
    .pipe(tRev())
    .pipe(through.obj(function (obj, enc, cb) {
      var contents = obj.contents.toString('utf-8');
      var contents = contents.replace(filePathRegex, function (all, left, filePath, right) {
        var staticPrefix = config.staticPrefix || '/dist';
        var index, search;
        filePath = filePath.slice(3);
        if ((index=filePath.indexOf('?'))>-1 || (index=filePath.indexOf('#'))>-1) {
          search = filePath.substring(index);
          filePath = filePath.substring(0, index);
        }
        if (revMap[filePath]) return left + staticPrefix + '/' + revMap[filePath] + (search || '') + right;
        else return all;
      });
      obj.contents = new Buffer(contents);
      this.push(obj);
      cb();
    }))
    .pipe(tDest('css'))
});

gulp.task('build-js-lib', ['build-js', 'build-css', 'build-assets'], function () {
  return sJsLib()
    .pipe(tRev())
    .pipe(tDest('js-lib'))
});

gulp.task('build', ['build-js', 'build-js-lib', 'build-assets', 'build-css']);
gulp.task('default', ['build']);

/* log out piped files info
    .pipe(through.obj(function (obj, enc, cb) {
      console.log(_.pick(obj, 'path base cwd'.split(' ')));
      this.push(obj);
      cb();
    }))
*/
