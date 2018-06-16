'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const del = require('del');

gulp.task('clean', function(cb) {
  return del(['styles'], cb);
});

gulp.task('sass', function () {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./styles'));
});

gulp.task('watch', function () {
  gulp.watch('./sass/**/*.scss', gulp.series('sass'));
});

gulp.task('default', gulp.series('clean', 'sass', 'watch'));