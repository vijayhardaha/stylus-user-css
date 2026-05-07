/**
 * ======================================================================
 * Gulp Build Tasks
 * ======================================================================
 * Purpose: Task definitions for building and watching SCSS -> CSS outputs.
 * Docs:    https://gulpjs.com/docs/en/getting-started/quick-start
 * ======================================================================
 */

import { deleteSync } from 'del'; // Delete files and directories
import autoprefixer from 'autoprefixer'; // Autoprefix CSS properties
import cleancss from 'gulp-clean-css'; // Minify CSS
import * as dartSass from 'sass'; // Compile SCSS to CSS
import duplicates from 'postcss-discard-duplicates'; // Remove duplicate CSS rules
import gulp from 'gulp'; // Gulp task runner
import gulpSass from 'gulp-sass'; // Compile SCSS to CSS
import plumber from 'gulp-plumber'; // Handle errors gracefully
import postcss from 'gulp-postcss'; // Process CSS with PostCSS
import rename from 'gulp-rename'; // Rename files
import mergeRules from 'postcss-merge-rules'; // Merge CSS rules

// Initialize gulp-sass with dart-sass
const sass = gulpSass(dartSass);

/**
 * Build CSS from SCSS files (excludes partials starting with _).
 *
 * @returns {NodeJS.ReadableStream} The gulp stream.
 */
const buildCSS = async () => {
  return gulp
    .src('src/**/!(_)*.scss')
    .pipe(plumber())
    .pipe(
      sass({
        quietDeps: true,
        silenceDeprecations: ['moz-document'],
        verbose: false,
        logger: sass.compiler.Logger.silent,
      })
    )
    .pipe(postcss([duplicates(), mergeRules(), autoprefixer()]))
    .pipe(cleancss({ format: 'beautify', level: { 1: { specialComments: 1 } } }))
    .pipe(rename({ suffix: '.user' }))
    .pipe(
      rename((path) => {
        // Remove 'styles/' from the path (src/styles/font-overrides/ -> dist/font-overrides/)
        path.dirname = path.dirname.replace(/^styles\/?/, '');
      })
    )
    .pipe(gulp.dest('dist'));
};

/**
 * Clean the build directory by deleting the 'dist' directory.
 */
const cleanAssets = async () => {
  deleteSync('dist');
};

/**
 * Watch for changes in SCSS files and trigger the 'buildCSS' task.
 */
const watchAssets = async () => {
  gulp.watch('src/**/!(_)*.scss', gulp.series(buildCSS));
};

// Define a series of tasks that should run in a sequence
const build = gulp.series(cleanAssets, buildCSS);

// Export the 'build' task and rename 'watchAssets' to 'watch' for better clarity.
export { build };
export { watchAssets as watch };
