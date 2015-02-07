gulp = require 'gulp'
seq = require 'gulp-sequence'
transform = require 'vinyl-transform'
browserify = require 'browserify'
del = require 'del'
rename = require 'gulp-rename'
uglify = require 'gulp-uglify'

gulp.task 'clean', (cb) ->
  del ['dist'], cb

gulp.task 'copy', ->
  gulp.src ['app/**', '!app/scripts/**']
  .pipe(gulp.dest('dist'))

gulp.task 'browserify', ->
  browserified = transform((fname) -> browserify(fname).bundle())
  gulp.src ['app/scripts/contentscript.coffee']
  .pipe(browserified)
  .pipe(rename('contentscript.js'))
  .pipe(uglify())
  .pipe(gulp.dest('dist/scripts'))

gulp.task 'build', ['copy', 'browserify']

gulp.task 'default', seq('clean', 'build')