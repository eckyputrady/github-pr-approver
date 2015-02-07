gulp = require 'gulp'
seq = require 'gulp-sequence'
transform = require 'vinyl-transform'
browserify = require 'browserify'
del = require 'del'
rename = require 'gulp-rename'
uglify = require 'gulp-uglify'
gulpif = require 'gulp-if'
zip = require 'gulp-zip'

isProd = require('minimist')(process.argv.slice(2))._[0] == 'prod'
console.log(if isProd then 'You are running PRODUCTION build' else '')

gulp.task 'clean', (cb) ->
  del ['dist', 'package'], cb

gulp.task 'copy', ->
  gulp.src ['app/**', '!app/scripts/**']
  .pipe(gulp.dest('dist'))

gulp.task 'browserify', ->
  browserified = transform((fname) -> browserify(fname).bundle())
  gulp.src ['app/scripts/contentscript.coffee']
  .pipe(browserified)
  .pipe(rename('contentscript.js'))
  .pipe(gulpif(isProd, uglify()))
  .pipe(gulp.dest('dist/scripts'))

gulp.task 'zip', ->
  gulp.src ['dist/**']
  .pipe(zip('archive.zip'))
  .pipe(gulp.dest('package'))

gulp.task 'build', ['copy', 'browserify']

gulp.task 'default', seq('clean', 'build')

gulp.task 'prod', seq('default', 'zip')