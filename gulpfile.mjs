/**
 * Required packages
 */
import { deleteSync } from "del"; // Delete files and directories
import autoprefixer from "autoprefixer"; // Autoprefix CSS properties
import cleancss from "gulp-clean-css"; // Minify CSS
import * as dartSass from "sass"; // Compile SCSS to CSS
import duplicates from "postcss-discard-duplicates"; // Remove duplicate CSS rules
import gulp from "gulp"; // Gulp task runner
import gulpSass from "gulp-sass"; // Compile SCSS to CSS
import plumber from "gulp-plumber"; // Handle errors gracefully
import postcss from "gulp-postcss"; // Process CSS with PostCSS
import rename from "gulp-rename"; // Rename files
import mergeRules from 'postcss-merge-rules'; // Merge CSS rules

// Initialize gulp-sass with dart-sass
const sass = gulpSass(dartSass);

/**
 * Build CSS from LESS files.
 *
 * @param {Function} done - A callback function to signal task completion.
 */
const buildCSS = (done) => {
	gulp.src("src/**/*.scss") // Source LESS files
		.pipe(plumber()) // Handle errors gracefully
		.pipe(
			sass({
				quietDeps: true,
				silenceDeprecations: ["moz-document"],
				verbose: false,
				logger: sass.compiler.Logger.silent,
			}),
		) // Compile SCSS to CSS
		.pipe(postcss([duplicates(), mergeRules(), autoprefixer()])) // Process CSS with PostCSS plugins
		.pipe(cleancss({ format: "beautify" })) // Minify CSS
		.pipe(rename({ suffix: ".user" })) // Rename output files
		.pipe(gulp.dest("dist")); // Output directory

	done(); // Signal task completion
};

/**
 * Clean the build directory by deleting the 'dist' directory.
 *
 * @param {Function} done - A callback function to signal task completion.
 */
const cleanAssets = (done) => {
	deleteSync("dist"); // Delete the 'dist' directory

	done(); // Signal task completion
};

/**
 * Watch for changes in LESS files and trigger the 'buildCSS' task.
 *
 * @param {Function} done - A callback function to signal task completion.
 */
const watchAssets = (done) => {
	gulp.watch("src/**/*.scss", gulp.series(buildCSS)); // Watch LESS files for changes and run 'buildCSS' task

	done(); // Signal task completion
};

// Define a series of tasks that should run in a sequence
const build = gulp.series(cleanAssets, buildCSS);

// Export the 'build' task and rename 'watchAssets' to 'watch' for better clarity.
export { build };
export { watchAssets as watch };
