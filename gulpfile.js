'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const del = require('del');
const rename = require('gulp-rename');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const gutil = require('gulp-util');
const glob = require('glob');
const es = require('event-stream');

const ENTRIES = [
  './js/main.js',
  './js/restaurant_info.js'
];

gulp.task('clean', function(cb) {
  return del(['css'], cb);
});

gulp.task('sass', function () {
  return gulp.src('./sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(rename({ basename: 'styles' }))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('js', function(done) {
  glob('./js/*.js', function(err, files) {
    if(err) done(err);

    var tasks = files.map(function(entry) {
      return browserify({ entries: [entry] })
        .transform('babelify', {presets: ["env"]})
        .bundle()
        .pipe(source(entry))
        .pipe(rename({
          extname: '.bundle.js'
        }))
        .pipe(gulp.dest('./dist'));
    });
    es.merge(tasks).on('end', done);
  })
});

gulp.task('watch', function () {
  gulp.watch('./sass/**/*.scss', gulp.series('sass'));
  gulp.watch('./js/**/*.js', gulp.series('js'));
});

gulp.task('default', gulp.series('clean', 'sass', 'js', 'watch'));