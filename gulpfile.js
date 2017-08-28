'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');

// Browserify dependencies
var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign');
var babel = require('babelify');


// browserSync dependencies
var browserSync = require('browser-sync');
var devip = require('dev-ip');

const USE_BABEL = false;

initBrowserify();

initBrowserSync();

function initBrowserify() {
  var customOpts = {
    entries: ['./js/script.js'],
    debug: true
  };
  var opts = assign({}, watchify.args, customOpts);
  var b = watchify(
    browserify(opts)
  );
  if(USE_BABEL){
    b.transform(babel, {
    presets: [
      "es2015",
      "es2016",
      ["env", {
        targets: {
          "browsers": ["last 2 versions", "safari >= 7"]
        }
      }]
    ]
    // sourceType: "module"
  });
  }
  gulp.task('js', bundle);
  b.on('update', bundle);
  b.on('log', gutil.log);
  bundle();

  function bundle() {
    console.log("Running 'Browserify'");
    return b.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('script.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/js'))
    .pipe(browserSync.stream({once: true}))
    ;
  }
}

function initBrowserSync() {
  gulp.task('browser-reload', function () {
    browserSync.reload();
  });
   gulp.task('browser-sync', ['browser-reload'], function() {
     browserSync({
       host: devip()[devip().length-1],
       server: {
         baseDir: './'
       },
       port: 3010,
       ui: {
         port: 3011
       }
     });
  });
  gulp.task('watch', function () {
      gulp.watch(['./**', '!./node_modules/**', '!*.js', '*.map', './gulpfile.js'], ['browser-reload']);
  });
  gulp.task('default', ['browser-sync', 'watch']);
}
